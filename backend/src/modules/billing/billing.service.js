const { AppError } = require("../../utils/AppError");
const { createBillingConfig } = require("./billing.config");
const { calculateTaxBreakdown } = require("./gst.engine");
const {
  BillingProfile,
  toPublicBillingProfile,
} = require("./billing-profile.model");
const { Invoice, toPublicInvoice } = require("./invoice.model");
const { nextInvoiceNumber } = require("./invoice-counter.model");
const {
  buildInvoiceHtml,
  buildInvoiceEmailText,
} = require("./invoice-document");

function createBillingService({ env, catalog, emailService }) {
  const config = createBillingConfig(env);

  function resolvePlan(planId, country) {
    const id = planId || "annual_access";
    if (typeof catalog.getPlanForCountry === "function") {
      return catalog.getPlanForCountry(id, country || "IN");
    }
    return catalog.getPlan(id);
  }

  function assertProfileComplete(profile) {
    if (!profile?.legalName?.trim()) {
      throw new AppError(
        "Billing profile is required before checkout",
        400,
        "BILLING_PROFILE_REQUIRED"
      );
    }
    const address = profile.address || {};
    const country = String(address.country || "IN").toUpperCase();
    if (!address.line1?.trim() || !address.city?.trim() || !address.pincode?.trim()) {
      throw new AppError(
        "Complete billing address is required",
        400,
        "BILLING_PROFILE_REQUIRED"
      );
    }
    if (country === "IN" && !address.stateCode?.trim()) {
      throw new AppError(
        "Billing state is required for India",
        400,
        "BILLING_PROFILE_REQUIRED"
      );
    }
    if (country === "IN" && profile.gstRegistered && !profile.gstin?.trim()) {
      throw new AppError(
        "GSTIN is required for GST-registered buyers",
        400,
        "GSTIN_REQUIRED"
      );
    }
  }

  function buildBreakdownFromProfile(profile, plan) {
    assertProfileComplete(profile);
    const address = profile.address || {};
    return calculateTaxBreakdown({
      amountInclusivePaise: plan.amountMinor,
      buyerCountry: address.country,
      buyerStateCode: address.stateCode,
      supplierStateCode: config.supplierStateCode,
      gstRegistered: Boolean(profile.gstRegistered),
      gstin: profile.gstin,
      exportTreatment: config.exportTreatment,
      sacCode: config.sacCode,
      currency: plan.currency,
    });
  }

  function quoteFromBreakdown(plan, breakdown) {
    return {
      catalogPlanId: plan.id,
      currency: breakdown.currency,
      amountInclusivePaise: breakdown.amountInclusivePaise,
      taxablePaise: breakdown.taxablePaise,
      cgstPaise: breakdown.cgstPaise,
      sgstPaise: breakdown.sgstPaise,
      igstPaise: breakdown.igstPaise,
      totalGstPaise: breakdown.totalGstPaise,
      taxType: breakdown.taxType,
      taxTreatment: breakdown.taxTreatment,
      placeOfSupply: breakdown.placeOfSupply,
      placeOfSupplyGstCode: breakdown.placeOfSupplyGstCode,
      sacCode: breakdown.sacCode,
      isExport: breakdown.isExport,
      quotedAt: new Date(),
    };
  }

  function publicTaxPreview(plan, breakdown) {
    return {
      planId: plan.id,
      planCode: plan.code || plan.id,
      planName: plan.name,
      currency: breakdown.currency,
      amountInclusive: breakdown.amountInclusive,
      taxableAmount: breakdown.taxableAmount,
      cgstAmount: breakdown.cgstAmount,
      sgstAmount: breakdown.sgstAmount,
      igstAmount: breakdown.igstAmount,
      totalGstAmount: breakdown.totalGstAmount,
      gstRate: breakdown.gstRate,
      taxType: breakdown.taxType,
      taxTreatment: breakdown.taxTreatment,
      placeOfSupply: breakdown.placeOfSupply,
      placeOfSupplyGstCode: breakdown.placeOfSupplyGstCode,
      sacCode: breakdown.sacCode,
      isExport: breakdown.isExport,
      supplierStateCode: breakdown.supplierStateCode,
      notes: breakdown.isExport
        ? "Tax treatment is based on billing details and applicable export configuration."
        : "Price is GST-inclusive. Breakdown is for invoice and accounting.",
    };
  }

  async function getProfile(userId) {
    const profile = await BillingProfile.findOne({ user: userId });
    return toPublicBillingProfile(profile);
  }

  async function upsertProfile(userId, input, userHints = {}) {
    const country = String(input.address.country || "IN").toUpperCase();
    const gstRegistered = country === "IN" ? Boolean(input.gstRegistered) : false;
    const gstin =
      gstRegistered && input.gstin
        ? String(input.gstin).trim().toUpperCase()
        : "";

    // Validate tax path early so bad GSTIN / export config fails before save.
    const draftProfile = {
      legalName: input.legalName,
      gstRegistered,
      gstin,
      address: {
        ...input.address,
        country,
        stateCode: String(input.address.stateCode || "").toUpperCase(),
      },
    };
    const plan = resolvePlan("annual_access", country);
    const breakdown = buildBreakdownFromProfile(draftProfile, plan);

    const update = {
      legalName: input.legalName.trim(),
      billingEmail: (input.billingEmail || userHints.email || "").trim().toLowerCase(),
      customerType: input.customerType || "business",
      gstRegistered,
      gstin,
      taxId: country === "IN" ? "" : String(input.taxId || "").trim(),
      address: {
        line1: input.address.line1.trim(),
        line2: (input.address.line2 || "").trim(),
        city: input.address.city.trim(),
        state: (input.address.state || "").trim(),
        stateCode: String(input.address.stateCode || "")
          .trim()
          .toUpperCase(),
        pincode: input.address.pincode.trim(),
        country,
      },
      pendingTaxQuote: quoteFromBreakdown(plan, breakdown),
    };

    const profile = await BillingProfile.findOneAndUpdate(
      { user: userId },
      { $set: update },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    return {
      profile: toPublicBillingProfile(profile),
      taxPreview: publicTaxPreview(plan, breakdown),
    };
  }

  async function previewTax(userId, planId) {
    const profile = await BillingProfile.findOne({ user: userId });
    if (!profile) {
      throw new AppError(
        "Save billing details before previewing tax",
        400,
        "BILLING_PROFILE_REQUIRED"
      );
    }
    const country = String(profile.address?.country || "IN").toUpperCase();
    const plan = resolvePlan(planId, country);
    const breakdown = buildBreakdownFromProfile(profile, plan);
    profile.pendingTaxQuote = quoteFromBreakdown(plan, breakdown);
    await profile.save();
    return publicTaxPreview(plan, breakdown);
  }

  async function requireCheckoutReady(userId, planId) {
    const profile = await BillingProfile.findOne({ user: userId });
    assertProfileComplete(profile);
    const country = String(profile.address?.country || "IN").toUpperCase();
    const plan = resolvePlan(planId, country);
    const breakdown = buildBreakdownFromProfile(profile, plan);
    profile.pendingTaxQuote = quoteFromBreakdown(plan, breakdown);
    await profile.save();
    return { profile, plan, breakdown };
  }

  async function listInvoices(userId) {
    const rows = await Invoice.find({ user: userId })
      .sort({ invoiceDate: -1 })
      .limit(50);
    return rows.map(toPublicInvoice);
  }

  function monthRange(month) {
    const match = String(month || "").match(/^(\d{4})-(\d{2})$/);
    if (!match) return null;
    const year = Number(match[1]);
    const mon = Number(match[2]);
    if (mon < 1 || mon > 12) return null;
    const start = new Date(Date.UTC(year, mon - 1, 1, 0, 0, 0, 0));
    const end = new Date(Date.UTC(year, mon, 1, 0, 0, 0, 0));
    return { start, end };
  }

  async function listAdminInvoices({
    month,
    search = "",
    taxType = "all",
    page = 1,
    limit = 50,
  } = {}) {
    const query = { status: "issued" };
    const range = monthRange(month);
    if (range) {
      query.invoiceDate = { $gte: range.start, $lt: range.end };
    }
    if (taxType && taxType !== "all") {
      query.taxType = taxType;
    }
    const q = String(search || "").trim();
    if (q) {
      const escaped = q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const regex = new RegExp(escaped, "i");
      query.$or = [
        { invoiceNumber: regex },
        { "buyer.legalName": regex },
        { "buyer.gstin": regex },
        { razorpayPaymentId: regex },
        { placeOfSupply: regex },
      ];
    }

    const safeLimit = Math.min(Math.max(Number(limit) || 50, 1), 200);
    const safePage = Math.max(Number(page) || 1, 1);
    const skip = (safePage - 1) * safeLimit;

    const [total, rows, totalsAgg] = await Promise.all([
      Invoice.countDocuments(query),
      Invoice.find(query)
        .sort({ invoiceDate: -1 })
        .skip(skip)
        .limit(safeLimit)
        .lean(),
      Invoice.aggregate([
        { $match: query },
        {
          $group: {
            _id: null,
            invoiceCount: { $sum: 1 },
            taxablePaise: { $sum: "$taxablePaise" },
            cgstPaise: { $sum: "$cgstPaise" },
            sgstPaise: { $sum: "$sgstPaise" },
            igstPaise: { $sum: "$igstPaise" },
            totalGstPaise: { $sum: "$totalGstPaise" },
            amountInclusivePaise: { $sum: "$amountInclusivePaise" },
            exportCount: {
              $sum: { $cond: [{ $eq: ["$isExport", true] }, 1, 0] },
            },
          },
        },
      ]),
    ]);

    const totals = totalsAgg[0] || {
      invoiceCount: 0,
      taxablePaise: 0,
      cgstPaise: 0,
      sgstPaise: 0,
      igstPaise: 0,
      totalGstPaise: 0,
      amountInclusivePaise: 0,
      exportCount: 0,
    };

    const userIds = [
      ...new Set(rows.map((row) => String(row.user)).filter(Boolean)),
    ];
    const User = require("../users/user.model").User;
    const users = userIds.length
      ? await User.find({ _id: { $in: userIds } })
          .select("email companyName name")
          .lean()
      : [];
    const userMap = new Map(users.map((u) => [String(u._id), u]));

    const items = rows.map((row) => {
      const publicInvoice = toPublicInvoice(row);
      const user = userMap.get(String(row.user));
      return {
        ...publicInvoice,
        user: user
          ? {
              id: String(user._id),
              email: user.email || "",
              companyName: user.companyName || "",
              name: user.name || "",
            }
          : null,
      };
    });

    return {
      items,
      total,
      page: safePage,
      limit: safeLimit,
      month: month || null,
      summary: {
        invoiceCount: totals.invoiceCount || 0,
        exportCount: totals.exportCount || 0,
        taxableAmount: Number(((totals.taxablePaise || 0) / 100).toFixed(2)),
        cgstAmount: Number(((totals.cgstPaise || 0) / 100).toFixed(2)),
        sgstAmount: Number(((totals.sgstPaise || 0) / 100).toFixed(2)),
        igstAmount: Number(((totals.igstPaise || 0) / 100).toFixed(2)),
        totalGstAmount: Number(((totals.totalGstPaise || 0) / 100).toFixed(2)),
        amountInclusive: Number(
          ((totals.amountInclusivePaise || 0) / 100).toFixed(2)
        ),
      },
    };
  }

  function logoUrl() {
    return `${String(env.CLIENT_ORIGIN || "").replace(/\/$/, "")}/quantaloop%20logo.png`;
  }

  function enrichInvoiceForRender(invoice) {
    const pub = toPublicInvoice(invoice);
    return {
      ...pub,
      description: pub.description || config.invoiceDescription,
      sacCode: pub.sacCode || config.sacCode,
      seller: {
        ...(pub.seller || {}),
        legalName: pub.seller?.legalName || config.sellerLegalName,
        operatedBy: pub.seller?.operatedBy || config.sellerOperatedBy,
        gstin: pub.seller?.gstin || config.supplierGstin,
        address: pub.seller?.address || config.sellerAddress,
        stateCode: pub.seller?.stateCode || config.supplierStateCode,
        stateName: pub.seller?.stateName || config.supplierStateName,
      },
    };
  }

  async function getAdminInvoiceHtml(invoiceId) {
    const invoice = await Invoice.findById(invoiceId);
    if (!invoice) {
      throw new AppError("Invoice not found", 404, "INVOICE_NOT_FOUND");
    }
    // Always render from stored fields so currency / seller / SAC stay correct.
    return buildInvoiceHtml(enrichInvoiceForRender(invoice), {
      logoUrl: logoUrl(),
    });
  }

  async function getInvoiceForUser(userId, invoiceId) {
    const invoice = await Invoice.findOne({ _id: invoiceId, user: userId });
    if (!invoice) {
      throw new AppError("Invoice not found", 404, "INVOICE_NOT_FOUND");
    }
    return toPublicInvoice(invoice);
  }

  async function getInvoiceHtmlForUser(userId, invoiceId) {
    const invoice = await Invoice.findOne({ _id: invoiceId, user: userId });
    if (!invoice) {
      throw new AppError("Invoice not found", 404, "INVOICE_NOT_FOUND");
    }
    return buildInvoiceHtml(enrichInvoiceForRender(invoice), {
      logoUrl: logoUrl(),
    });
  }

  /**
   * Creates an immutable GST invoice after a captured payment.
   * Idempotent on razorpayPaymentId. Never throws to callers that wrap it —
   * returns null on skip/failure logging is caller's choice; we throw on logic
   * errors so the caller can swallow without blocking membership.
   */
  async function issueInvoiceForPayment({
    userId,
    subscription,
    paymentId,
    payment,
  }) {
    if (!paymentId) return null;
    const existing = await Invoice.findOne({ razorpayPaymentId: paymentId });
    if (existing) return toPublicInvoice(existing);

    const profile = await BillingProfile.findOne({ user: userId });
    if (!profile) {
      throw new AppError(
        "Billing profile missing for invoice",
        400,
        "BILLING_PROFILE_REQUIRED"
      );
    }

    const country = String(profile.address?.country || "IN").toUpperCase();
    const plan = resolvePlan(subscription?.catalogPlanId || "annual_access", country);
    const paidAmount = Number(payment?.amount);
    const paidCurrency = String(payment?.currency || plan.currency).toUpperCase();
    if (Number.isFinite(paidAmount) && paidAmount !== plan.amountMinor) {
      throw new AppError(
        "Payment amount does not match plan for invoicing",
        409,
        "PAYMENT_AMOUNT_MISMATCH"
      );
    }
    if (paidCurrency !== String(plan.currency).toUpperCase()) {
      throw new AppError(
        "Payment currency does not match plan for invoicing",
        409,
        "PAYMENT_AMOUNT_MISMATCH"
      );
    }

    let breakdown;
    const quote = profile.pendingTaxQuote;
    if (
      quote &&
      quote.catalogPlanId === plan.id &&
      Number(quote.amountInclusivePaise) === plan.amountMinor
    ) {
      breakdown = {
        currency: String(
          payment?.currency || quote.currency || plan.currency || "INR"
        ).toUpperCase(),
        amountInclusivePaise: quote.amountInclusivePaise,
        amountInclusive: Number((quote.amountInclusivePaise / 100).toFixed(2)),
        taxablePaise: quote.taxablePaise,
        taxableAmount: Number((quote.taxablePaise / 100).toFixed(2)),
        cgstPaise: quote.cgstPaise,
        sgstPaise: quote.sgstPaise,
        igstPaise: quote.igstPaise,
        totalGstPaise: quote.totalGstPaise,
        cgstAmount: Number((quote.cgstPaise / 100).toFixed(2)),
        sgstAmount: Number((quote.sgstPaise / 100).toFixed(2)),
        igstAmount: Number((quote.igstPaise / 100).toFixed(2)),
        totalGstAmount: Number((quote.totalGstPaise / 100).toFixed(2)),
        taxType: quote.taxType,
        taxTreatment: quote.taxTreatment,
        placeOfSupply: quote.placeOfSupply,
        placeOfSupplyGstCode: quote.placeOfSupplyGstCode,
        sacCode: quote.sacCode || config.sacCode,
        isExport: Boolean(quote.isExport),
        gstRate: quote.isExport ? 0 : 0.18,
        supplierStateCode: config.supplierStateCode,
      };
    } else {
      breakdown = buildBreakdownFromProfile(profile, plan);
    }

    const invoiceDate = payment?.created_at
      ? new Date(Number(payment.created_at) * 1000)
      : new Date();
    const invoiceNumber = await nextInvoiceNumber(config.invoicePrefix, invoiceDate);
    const paymentCurrency = String(
      payment?.currency || breakdown.currency || plan.currency || "INR"
    ).toUpperCase();
    const orderId =
      payment?.order_id || subscription?.razorpayOrderId || null;

    const publicShape = {
      invoiceNumber,
      invoiceDate,
      currency: paymentCurrency,
      description: config.invoiceDescription || "Annual platform access",
      sacCode: breakdown.sacCode || config.sacCode,
      placeOfSupply: breakdown.placeOfSupply,
      taxType: breakdown.taxType,
      taxTreatment: breakdown.taxTreatment,
      isExport: breakdown.isExport,
      amountInclusive: breakdown.amountInclusive,
      taxableAmount: breakdown.taxableAmount,
      cgstAmount: breakdown.cgstAmount,
      sgstAmount: breakdown.sgstAmount,
      igstAmount: breakdown.igstAmount,
      totalGstAmount: breakdown.totalGstAmount,
      buyer: {
        legalName: profile.legalName,
        billingEmail: profile.billingEmail,
        customerType: profile.customerType,
        gstRegistered: profile.gstRegistered,
        gstin: profile.gstin || null,
        taxId: profile.taxId || null,
        address: {
          line1: profile.address?.line1 || "",
          line2: profile.address?.line2 || "",
          city: profile.address?.city || "",
          state: profile.address?.state || "",
          stateCode: profile.address?.stateCode || "",
          pincode: profile.address?.pincode || "",
          country: profile.address?.country || "IN",
        },
      },
      seller: {
        legalName: config.sellerLegalName,
        operatedBy: config.sellerOperatedBy,
        gstin: config.supplierGstin,
        address: config.sellerAddress,
        stateCode: config.supplierStateCode,
        stateName: config.supplierStateName,
      },
      razorpayPaymentId: paymentId,
      razorpayOrderId: orderId,
    };

    const htmlBody = buildInvoiceHtml(publicShape, {
      logoUrl: `${String(env.CLIENT_ORIGIN || "").replace(/\/$/, "")}/quantaloop%20logo.png`,
    });

    let invoice;
    try {
      invoice = await Invoice.create({
        invoiceNumber,
        invoiceDate,
        user: userId,
        subscription: subscription?._id || null,
        catalogPlanId: plan.id,
        razorpayPaymentId: paymentId,
        razorpaySubscriptionId:
          subscription?.razorpaySubscriptionId || payment?.subscription_id || null,
        razorpayOrderId: orderId,
        status: "issued",
        currency: paymentCurrency,
        description: publicShape.description,
        sacCode: publicShape.sacCode,
        placeOfSupply: breakdown.placeOfSupply,
        placeOfSupplyGstCode: breakdown.placeOfSupplyGstCode,
        taxType: breakdown.taxType,
        taxTreatment: breakdown.taxTreatment,
        isExport: breakdown.isExport,
        gstRate: breakdown.gstRate ?? 0.18,
        amountInclusivePaise: breakdown.amountInclusivePaise,
        taxablePaise: breakdown.taxablePaise,
        cgstPaise: breakdown.cgstPaise,
        sgstPaise: breakdown.sgstPaise,
        igstPaise: breakdown.igstPaise,
        totalGstPaise: breakdown.totalGstPaise,
        buyer: publicShape.buyer,
        seller: publicShape.seller,
        htmlBody,
      });
    } catch (error) {
      if (error?.code === 11000) {
        const again = await Invoice.findOne({ razorpayPaymentId: paymentId });
        if (again) return toPublicInvoice(again);
      }
      throw error;
    }

    const to = profile.billingEmail || null;
    if (to && emailService?.sendInvoiceEmail) {
      try {
        await emailService.sendInvoiceEmail({
          to,
          invoiceNumber,
          html: htmlBody,
          text: buildInvoiceEmailText(publicShape),
          invoice: publicShape,
        });
      } catch (mailError) {
        process.stderr.write(
          `[billing] invoice email failed for ${invoiceNumber}: ${mailError.message}\n`
        );
      }
    }

    return toPublicInvoice(invoice);
  }

  return {
    config,
    getProfile,
    upsertProfile,
    previewTax,
    requireCheckoutReady,
    listInvoices,
    listAdminInvoices,
    getAdminInvoiceHtml,
    getInvoiceForUser,
    getInvoiceHtmlForUser,
    issueInvoiceForPayment,
  };
}

module.exports = { createBillingService };
