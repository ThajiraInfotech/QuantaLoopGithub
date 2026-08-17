import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const outDir = path.join(__dirname, "..", "messages", "partials");

const ADDR = "LEGAL_COMPANY_ADDRESS";

const en = {
  common: {
    operatedBy: "Operated by {operator}",
    lastUpdated: "Last Updated: {date}",
    backToHome: "Back to home",
  },
  consent: {
    prefix: "I agree to the",
    terms: "Terms & Conditions",
    and: "and",
    privacy: "Privacy Policy",
    suffix: ".",
  },
  terms: {
    title: "Terms & Conditions",
    intro: [
      {
        kind: "paragraph",
        text: 'Welcome to Quanta Loop, a digital platform operated by ASM Fintech Private Limited ("ASM Fintech", "Quanta Loop", "we", "our", or "us").',
      },
      {
        kind: "paragraph",
        text: 'These Terms & Conditions ("Terms") govern your access to and use of the Quanta Loop platform, website, software, applications and related services (collectively, the "Platform").',
      },
      {
        kind: "paragraph",
        text: "By registering, accessing or using the Platform, you agree to these Terms. If you do not agree, please do not use the Platform.",
      },
    ],
    sections: [
      {
        title: "1. ABOUT QUANTA LOOP",
        blocks: [
          {
            kind: "paragraph",
            text: "Quanta Loop is a technology-enabled intermediary platform that enables industrial waste generators to publish waste listings and allows aggregators, recyclers and related stakeholders to discover and express interest in such listings.",
          },
          { kind: "paragraph", text: "The Platform may provide:" },
          {
            kind: "list",
            items: [
              "automated matching;",
              "in-platform chat and communications;",
              "notifications;",
              "subscription access;",
              "analytics;",
              "and other digital tools.",
            ],
          },
          {
            kind: "paragraph",
            text: "Users may independently communicate and negotiate with each other regarding:",
          },
          {
            kind: "list",
            items: [
              "pricing;",
              "transportation;",
              "inspection;",
              "logistics;",
              "delivery;",
              "quality;",
              "and commercial terms.",
            ],
          },
        ],
      },
      {
        title: "2. IMPORTANT PLATFORM DISCLAIMER",
        blocks: [
          {
            kind: "paragraph",
            text: "Quanta Loop is ONLY a technology intermediary platform.",
          },
          { kind: "paragraph", text: "Quanta Loop is NOT:" },
          {
            kind: "list",
            items: [
              "a buyer;",
              "seller;",
              "recycler;",
              "transporter;",
              "broker;",
              "waste handler;",
              "inspection agency;",
              "logistics provider;",
              "environmental consultant;",
              "or regulatory/compliance authority.",
            ],
          },
          { kind: "paragraph", text: "Quanta Loop does NOT:" },
          {
            kind: "list",
            items: [
              "take ownership of waste;",
              "store or transport waste;",
              "inspect materials;",
              "verify legality of listings;",
              "verify environmental compliance;",
              "verify GST registrations;",
              "verify licences or permissions;",
              "verify recyclers or aggregators;",
              "guarantee quality;",
              "guarantee deliveries;",
              "guarantee payments;",
              "or guarantee completion of transactions.",
            ],
          },
          {
            kind: "paragraph",
            text: "All transactions and dealings occur directly between users at their own discretion and risk.",
          },
          { kind: "paragraph", text: "All responsibility relating to:" },
          {
            kind: "list",
            items: [
              "legality;",
              "permits;",
              "pollution control approvals;",
              "environmental compliance;",
              "hazardous material handling;",
              "transportation;",
              "taxes;",
              "safety;",
              "quality;",
              "payment;",
              "and contractual obligations",
            ],
          },
          {
            kind: "paragraph",
            text: "shall remain solely between the concerned users.",
          },
        ],
      },
      {
        title: "3. ELIGIBILITY & USER ACCOUNTS",
        subsections: [
          {
            title: "3.1 Eligibility",
            blocks: [
              {
                kind: "paragraph",
                text: "The Platform is intended for business and professional users who are at least 18 years old and legally capable of entering into binding contracts.",
              },
            ],
          },
          {
            title: "3.2 Registration",
            blocks: [
              { kind: "paragraph", text: "Users may register using:" },
              {
                kind: "list",
                items: [
                  "mobile OTP;",
                  "email OTP;",
                  "company information;",
                  "and optional GST details.",
                ],
              },
            ],
          },
          {
            title: "3.3 Accuracy of Information",
            blocks: [
              {
                kind: "paragraph",
                text: "Users are solely responsible for:",
              },
              {
                kind: "list",
                items: [
                  "accuracy of submitted information;",
                  "legality of listings;",
                  "and compliance with applicable laws.",
                ],
              },
              {
                kind: "paragraph",
                text: "Quanta Loop does not independently verify user information, licences, permits, certifications, GST details or environmental approvals.",
              },
            ],
          },
          {
            title: "3.4 Account Security",
            blocks: [
              {
                kind: "paragraph",
                text: "Users are responsible for maintaining confidentiality of account credentials and for activities occurring through their accounts.",
              },
            ],
          },
        ],
      },
      {
        title: "4. PLATFORM SERVICES & FEATURES",
        blocks: [
          { kind: "paragraph", text: "Current features may include:" },
          {
            kind: "list",
            items: [
              "listing creation;",
              "automated matching;",
              "in-platform messaging/chat;",
              "notifications;",
              "and subscription access.",
            ],
          },
          { kind: "paragraph", text: "Future features may include:" },
          {
            kind: "list",
            items: [
              "AI recommendations;",
              "analytics;",
              "logistics tracking;",
              "document storage;",
              "live tracking;",
              "and additional technology tools.",
            ],
          },
          {
            kind: "paragraph",
            text: "Quanta Loop reserves the right to modify, suspend, discontinue or introduce features at any time without prior notice.",
          },
        ],
      },
      {
        title: "5. SUBSCRIPTIONS & PAYMENTS",
        subsections: [
          {
            title: "5.1 Subscription Fees",
            blocks: [
              {
                kind: "paragraph",
                text: "Certain features of the Platform may require payment of subscription or access fees.",
              },
              {
                kind: "paragraph",
                text: "Applicable pricing and plans may be updated periodically.",
              },
            ],
          },
          {
            title: "5.2 User Transactions",
            blocks: [
              {
                kind: "paragraph",
                text: "Commercial transactions between users occur independently outside the Platform.",
              },
              {
                kind: "paragraph",
                text: "Quanta Loop is not a party to transactions between users and shall not be responsible for:",
              },
              {
                kind: "list",
                items: [
                  "payment disputes;",
                  "pricing disputes;",
                  "failed transactions;",
                  "fraud;",
                  "delivery failures;",
                  "logistics issues;",
                  "inspection disputes;",
                  "or commercial disagreements.",
                ],
              },
            ],
          },
          {
            title: "5.3 Refunds",
            blocks: [
              {
                kind: "paragraph",
                text: "Unless expressly stated otherwise, subscription fees are non-refundable.",
              },
            ],
          },
        ],
      },
      {
        title: "6. USER CONTENT & LISTINGS",
        subsections: [
          {
            title: "6.1 User Content",
            blocks: [
              { kind: "paragraph", text: "Users may upload:" },
              {
                kind: "list",
                items: [
                  "listings;",
                  "images;",
                  "descriptions;",
                  "documents;",
                  "messages;",
                  'and related content ("User Content").',
                ],
              },
              {
                kind: "paragraph",
                text: "Users remain responsible for all User Content uploaded or shared through the Platform.",
              },
            ],
          },
          {
            title: "6.2 License to Quanta Loop",
            blocks: [
              {
                kind: "paragraph",
                text: "Users grant Quanta Loop a worldwide, non-exclusive, royalty-free license to:",
              },
              {
                kind: "list",
                items: [
                  "host;",
                  "display;",
                  "reproduce;",
                  "store;",
                  "distribute;",
                  "format;",
                  "analyse;",
                  "and use User Content",
                ],
              },
              { kind: "paragraph", text: "for purposes relating to:" },
              {
                kind: "list",
                items: [
                  "Platform operations;",
                  "analytics;",
                  "marketing;",
                  "service improvement;",
                  "moderation;",
                  "and technology functionality.",
                ],
              },
            ],
          },
          {
            title: "6.3 Content Moderation",
            blocks: [
              { kind: "paragraph", text: "Quanta Loop may:" },
              {
                kind: "list",
                items: [
                  "remove content;",
                  "restrict visibility;",
                  "suspend accounts;",
                  "investigate complaints;",
                  "and moderate activity",
                ],
              },
              {
                kind: "paragraph",
                text: "where it reasonably believes such action is necessary for platform integrity, safety or legal compliance.",
              },
            ],
          },
        ],
      },
      {
        title: "7. PROHIBITED ACTIVITIES",
        blocks: [
          { kind: "paragraph", text: "Users shall not:" },
          {
            kind: "list",
            items: [
              "upload illegal, prohibited or unlawful waste listings;",
              "list hazardous materials in violation of law;",
              "submit false or misleading information;",
              "impersonate others;",
              "engage in fraud or deceptive practices;",
              "harass or abuse other users;",
              "send spam or unsolicited communications;",
              "scrape or extract platform data;",
              "reverse engineer the Platform;",
              "bypass subscriptions or access controls;",
              "upload malware or malicious code;",
              "infringe intellectual property rights;",
              "misuse platform communications;",
              "interfere with platform security or operations;",
              "or use the Platform for unlawful activities.",
            ],
          },
          {
            kind: "paragraph",
            text: "Quanta Loop reserves the right to investigate and take action against violations.",
          },
        ],
      },
      {
        title: "8. PRIVACY, COOKIES & COMMUNICATIONS",
        blocks: [
          {
            kind: "paragraph",
            text: "By using the Platform, users consent to:",
          },
          {
            kind: "list",
            items: [
              "collection and processing of information as described in the Privacy Policy;",
              "use of cookies and analytics technologies;",
              "service-related notifications;",
              "transactional communications;",
              "marketing communications;",
              "and platform alerts.",
            ],
          },
          {
            kind: "paragraph",
            text: "Users may opt out of promotional communications where applicable.",
          },
          {
            kind: "paragraph",
            text: "Users acknowledge that certain essential service communications may still be sent.",
          },
        ],
      },
      {
        title: "9. INTELLECTUAL PROPERTY",
        blocks: [
          { kind: "paragraph", text: "All rights relating to:" },
          {
            kind: "list",
            items: [
              "Quanta Loop;",
              "platform software;",
              "branding;",
              "technology;",
              "matching systems;",
              "workflows;",
              "algorithms;",
              "analytics systems;",
              "interfaces;",
              "databases;",
              "and related intellectual property",
            ],
          },
          {
            kind: "paragraph",
            text: "belong exclusively to ASM Fintech Private Limited or its licensors.",
          },
          { kind: "paragraph", text: "Users shall not:" },
          {
            kind: "list",
            items: [
              "copy;",
              "reproduce;",
              "distribute;",
              "reverse engineer;",
              "modify;",
              "scrape;",
              "or commercially exploit",
            ],
          },
          {
            kind: "paragraph",
            text: "any part of the Platform without prior written permission.",
          },
        ],
      },
      {
        title: "10. THIRD-PARTY SERVICES",
        blocks: [
          {
            kind: "paragraph",
            text: "The Platform may integrate with third-party services, tools or software.",
          },
          { kind: "paragraph", text: "Quanta Loop is not responsible for:" },
          {
            kind: "list",
            items: [
              "third-party systems;",
              "third-party websites;",
              "external services;",
              "or third-party actions.",
            ],
          },
          {
            kind: "paragraph",
            text: "Use of third-party services may be subject to separate terms and policies.",
          },
        ],
      },
      {
        title: "11. DISCLAIMERS",
        subsections: [
          {
            title: '11.1 Platform Provided "As Is"',
            blocks: [
              {
                kind: "paragraph",
                text: 'The Platform is provided on an "as is" and "as available" basis.',
              },
              {
                kind: "paragraph",
                text: "Quanta Loop does not guarantee:",
              },
              {
                kind: "list",
                items: [
                  "uninterrupted availability;",
                  "error-free functionality;",
                  "accuracy of listings;",
                  "user authenticity;",
                  "transaction success;",
                  "payment completion;",
                  "legality of materials;",
                  "or platform availability at all times.",
                ],
              },
            ],
          },
          {
            title: "11.2 No Verification",
            blocks: [
              {
                kind: "paragraph",
                text: "Quanta Loop does not independently verify:",
              },
              {
                kind: "list",
                items: [
                  "users;",
                  "licences;",
                  "GST registrations;",
                  "environmental permissions;",
                  "waste legality;",
                  "transportation compliance;",
                  "or commercial representations.",
                ],
              },
              {
                kind: "paragraph",
                text: "Users interact and transact entirely at their own risk.",
              },
            ],
          },
          {
            title: "11.3 No Environmental or Regulatory Responsibility",
            blocks: [
              {
                kind: "paragraph",
                text: "Quanta Loop shall not be responsible for:",
              },
              {
                kind: "list",
                items: [
                  "environmental violations;",
                  "hazardous material handling;",
                  "transportation compliance;",
                  "pollution control compliance;",
                  "waste disposal legality;",
                  "or regulatory breaches by users.",
                ],
              },
            ],
          },
        ],
      },
      {
        title: "12. LIMITATION OF LIABILITY",
        blocks: [
          {
            kind: "paragraph",
            text: "To the maximum extent permitted by law, Quanta Loop, ASM Fintech Private Limited and their directors, employees, affiliates and representatives shall not be liable for:",
          },
          {
            kind: "list",
            items: [
              "indirect or consequential damages;",
              "loss of profits;",
              "business interruption;",
              "loss of data;",
              "environmental violations;",
              "user misconduct;",
              "hazardous material incidents;",
              "transportation issues;",
              "third-party actions;",
              "commercial disputes;",
              "payment failures;",
              "fraud;",
              "or failed transactions.",
            ],
          },
          {
            kind: "paragraph",
            text: "The total aggregate liability of Quanta Loop arising out of or relating to the Platform shall not exceed the subscription fees paid by the concerned user to Quanta Loop during the preceding three (3) months.",
          },
        ],
      },
      {
        title: "13. INDEMNITY",
        blocks: [
          {
            kind: "paragraph",
            text: "Users agree to defend, indemnify and hold harmless:",
          },
          {
            kind: "list",
            items: [
              "Quanta Loop;",
              "ASM Fintech Private Limited;",
              "its directors;",
              "employees;",
              "affiliates;",
              "advisors;",
              "and representatives",
            ],
          },
          {
            kind: "paragraph",
            text: "against any claims, liabilities, damages, penalties, losses or expenses arising from:",
          },
          {
            kind: "list",
            items: [
              "user content;",
              "waste listings;",
              "hazardous materials;",
              "legal violations;",
              "environmental non-compliance;",
              "transportation;",
              "taxes;",
              "user disputes;",
              "intellectual property infringement;",
              "or misuse of the Platform.",
            ],
          },
        ],
      },
      {
        title: "14. ACCOUNT SUSPENSION & TERMINATION",
        blocks: [
          {
            kind: "paragraph",
            text: "Quanta Loop may suspend, restrict or terminate accounts at its discretion where:",
          },
          {
            kind: "list",
            items: [
              "complaints are received;",
              "misuse is suspected;",
              "unlawful activity is suspected;",
              "platform integrity is at risk;",
              "or users violate these Terms.",
            ],
          },
          {
            kind: "paragraph",
            text: "Quanta Loop may also remove content or restrict platform access without prior notice where reasonably necessary.",
          },
        ],
      },
      {
        title: "15. DATA & ANALYTICS",
        blocks: [
          {
            kind: "paragraph",
            text: "Quanta Loop may use aggregated, anonymised or non-identifiable usage data for:",
          },
          {
            kind: "list",
            items: [
              "analytics;",
              "platform improvement;",
              "business insights;",
              "service optimisation;",
              "and technology development.",
            ],
          },
        ],
      },
      {
        title: "16. FORCE MAJEURE",
        blocks: [
          {
            kind: "paragraph",
            text: "Quanta Loop shall not be liable for delays or failures caused by events beyond reasonable control including:",
          },
          {
            kind: "list",
            items: [
              "internet failures;",
              "power outages;",
              "cyber incidents;",
              "governmental actions;",
              "strikes;",
              "natural disasters;",
              "or infrastructure failures.",
            ],
          },
        ],
      },
      {
        title: "17. CHANGES TO THE PLATFORM OR TERMS",
        blocks: [
          { kind: "paragraph", text: "Quanta Loop may:" },
          {
            kind: "list",
            items: [
              "modify the Platform;",
              "update features;",
              "revise pricing;",
              "or amend these Terms",
            ],
          },
          { kind: "paragraph", text: "at any time." },
          {
            kind: "paragraph",
            text: 'Updated Terms will be posted on the Platform with a revised "Last Updated" date.',
          },
          {
            kind: "paragraph",
            text: "Continued use of the Platform after updates constitutes acceptance of revised Terms.",
          },
        ],
      },
      {
        title: "18. GOVERNING LAW & DISPUTE RESOLUTION",
        blocks: [
          {
            kind: "paragraph",
            text: "These Terms shall be governed by the laws of India.",
          },
          {
            kind: "paragraph",
            text: "Any dispute arising from or relating to these Terms shall be referred to arbitration seated in Chennai under the Arbitration and Conciliation Act, 1996.",
          },
          {
            kind: "paragraph",
            text: "The arbitration shall be conducted by a sole arbitrator appointed by Quanta Loop.",
          },
          {
            kind: "paragraph",
            text: "The language of arbitration shall be English.",
          },
          {
            kind: "paragraph",
            text: "Courts at Chennai shall have exclusive jurisdiction for interim or injunctive relief.",
          },
        ],
      },
      {
        title: "19. CONTACT DETAILS",
        blocks: [
          { kind: "paragraph", text: ADDR },
          { kind: "email", label: "Email:" },
        ],
      },
    ],
  },
  privacy: {
    title: "Privacy Policy",
    intro: [
      {
        kind: "paragraph",
        text: 'ASM Fintech Private Limited ("ASM Fintech", "Quanta Loop", "we", "our", or "us") respects your privacy and is committed to protecting your personal information.',
      },
      {
        kind: "paragraph",
        text: 'This Privacy Policy explains how Quanta Loop collects, uses, stores, shares and protects information when you access or use the Quanta Loop platform, website, applications, products or related services (collectively, the "Platform").',
      },
      {
        kind: "paragraph",
        text: "By accessing or using the Platform, you agree to this Privacy Policy.",
      },
    ],
    sections: [
      {
        title: "1. ABOUT QUANTA LOOP",
        blocks: [
          {
            kind: "paragraph",
            text: "Quanta Loop is a technology-enabled intermediary platform that facilitates connections between industrial waste generators, aggregators, recyclers and related stakeholders.",
          },
          {
            kind: "paragraph",
            text: "Quanta Loop acts only as a technology platform/intermediary.",
          },
          {
            kind: "paragraph",
            text: "Information displayed or shared on the Platform is generally provided directly by users. Quanta Loop does not independently verify all user-submitted information, listings, claims, certifications, quantities, pricing, business credentials or representations.",
          },
          {
            kind: "paragraph",
            text: "Users are responsible for independently evaluating and verifying counterparties and transactions.",
          },
        ],
      },
      {
        title: "2. INFORMATION WE COLLECT",
        subsections: [
          {
            title: "2.1 Information You Provide",
            blocks: [
              {
                kind: "paragraph",
                text: "When you register or use the Platform, you may provide:",
              },
              {
                kind: "list",
                items: [
                  "name;",
                  "mobile number;",
                  "email address;",
                  "company/business details;",
                  "GST information (optional);",
                  "addresses;",
                  "profile details;",
                  "uploaded documents;",
                  "uploaded images;",
                  "waste listing information;",
                  "communication content;",
                  "and other information voluntarily submitted by you.",
                ],
              },
            ],
          },
          {
            title: "2.2 Platform & Transaction Information",
            blocks: [
              {
                kind: "paragraph",
                text: "We may collect information relating to:",
              },
              {
                kind: "list",
                items: [
                  "account activity;",
                  "user interactions;",
                  "listing activity;",
                  "enquiries;",
                  "subscriptions;",
                  "communication history;",
                  "transaction-related activity;",
                  "and support requests.",
                ],
              },
            ],
          },
          {
            title: "2.3 Device & Technical Information",
            blocks: [
              {
                kind: "paragraph",
                text: "We may automatically collect:",
              },
              {
                kind: "list",
                items: [
                  "IP address;",
                  "browser type;",
                  "device information;",
                  "operating system;",
                  "login activity;",
                  "location information;",
                  "cookies;",
                  "analytics data;",
                  "and usage patterns.",
                ],
              },
            ],
          },
        ],
      },
      {
        title: "3. HOW WE USE INFORMATION",
        blocks: [
          {
            kind: "paragraph",
            text: "We may use information for purposes including:",
          },
          {
            kind: "list",
            items: [
              "creating and managing user accounts;",
              "user authentication and login management;",
              "operating and improving the Platform;",
              "enabling user matching and interactions;",
              "facilitating communications;",
              "subscription management;",
              "customer support;",
              "analytics and business insights;",
              "fraud prevention and platform security;",
              "service improvement;",
              "marketing and promotional communications;",
              "legal and regulatory compliance;",
              "and enforcing our terms and policies.",
            ],
          },
        ],
      },
      {
        title: "4. COOKIES & ANALYTICS",
        blocks: [
          { kind: "paragraph", text: "Quanta Loop may use:" },
          {
            kind: "list",
            items: [
              "cookies;",
              "pixels;",
              "analytics tools;",
              "session tracking;",
              "performance monitoring technologies;",
              "and related technologies",
            ],
          },
          {
            kind: "paragraph",
            text: "to improve functionality, understand user behaviour and enhance platform performance.",
          },
          {
            kind: "paragraph",
            text: "These technologies may help us:",
          },
          {
            kind: "list",
            items: [
              "remember user preferences;",
              "improve navigation;",
              "analyse traffic;",
              "monitor platform performance;",
              "and personalise user experience.",
            ],
          },
          {
            kind: "paragraph",
            text: "Users may disable cookies through browser or device settings. However, certain features of the Platform may not function properly if cookies are disabled.",
          },
        ],
      },
      {
        title: "5. COMMUNICATIONS",
        blocks: [
          {
            kind: "paragraph",
            text: "By using the Platform, you consent to receive:",
          },
          {
            kind: "list",
            items: [
              "transactional emails;",
              "account notifications;",
              "login alerts;",
              "subscription updates;",
              "support communications;",
              "service announcements;",
              "and promotional or marketing communications.",
            ],
          },
          {
            kind: "paragraph",
            text: "You may opt out of promotional communications at any time using unsubscribe links or by contacting us. However, essential service-related communications may still be sent.",
          },
        ],
      },
      {
        title: "6. DATA SHARING & DISCLOSURE",
        blocks: [
          { kind: "paragraph", text: "We may share information with:" },
          {
            kind: "list",
            items: [
              "hosting and cloud service providers;",
              "technology and analytics providers;",
              "payment or communication service providers;",
              "professional advisors;",
              "legal or regulatory authorities where required;",
              "and other users as part of normal platform functionality.",
            ],
          },
          {
            kind: "paragraph",
            text: "For example, certain business or listing information may be visible to other users to facilitate transactions and platform interactions.",
          },
          {
            kind: "paragraph",
            text: "We do not sell personal data to third parties.",
          },
        ],
      },
      {
        title: "7. USER CONTENT & PLATFORM RESPONSIBILITY",
        blocks: [
          { kind: "paragraph", text: "Users are solely responsible for:" },
          {
            kind: "list",
            items: [
              "information uploaded by them;",
              "listings;",
              "business claims;",
              "pricing;",
              "certifications;",
              "communications;",
              "and transaction-related representations.",
            ],
          },
          {
            kind: "paragraph",
            text: "Quanta Loop does not guarantee the accuracy, completeness or reliability of user-generated content or third-party information.",
          },
        ],
      },
      {
        title: "8. DATA RETENTION",
        blocks: [
          {
            kind: "paragraph",
            text: "We retain information for as long as reasonably necessary for:",
          },
          {
            kind: "list",
            items: [
              "platform operations;",
              "customer support;",
              "legal compliance;",
              "dispute resolution;",
              "fraud prevention;",
              "internal analytics;",
              "and legitimate business purposes.",
            ],
          },
          {
            kind: "paragraph",
            text: "Certain information may continue to be retained where required by law or for operational, security or compliance purposes.",
          },
        ],
      },
      {
        title: "9. USER RIGHTS",
        blocks: [
          {
            kind: "paragraph",
            text: "Subject to applicable law, users may request to:",
          },
          {
            kind: "list",
            items: [
              "access their information;",
              "update or correct information;",
              "request deletion of information;",
              "withdraw certain consents;",
              "or contact us regarding privacy concerns.",
            ],
          },
          {
            kind: "paragraph",
            text: "Requests may be submitted to:",
          },
          { kind: "email", label: "Email:" },
          {
            kind: "paragraph",
            text: "We may retain certain information where required for:",
          },
          {
            kind: "list",
            items: [
              "legal obligations;",
              "dispute resolution;",
              "fraud prevention;",
              "audit requirements;",
              "or legitimate business purposes.",
            ],
          },
        ],
      },
      {
        title: "10. DATA SECURITY",
        blocks: [
          {
            kind: "paragraph",
            text: "We implement commercially reasonable safeguards to help protect information, including:",
          },
          {
            kind: "list",
            items: [
              "restricted access controls;",
              "password protections;",
              "reasonable technical measures;",
              "and internal security practices.",
            ],
          },
          {
            kind: "paragraph",
            text: "However, no method of internet transmission or electronic storage is completely secure.",
          },
          {
            kind: "paragraph",
            text: "Accordingly, we cannot guarantee absolute security of information.",
          },
        ],
      },
      {
        title: "11. THIRD-PARTY SERVICES",
        blocks: [
          {
            kind: "paragraph",
            text: "The Platform may integrate with or contain links to third-party services, tools or websites.",
          },
          { kind: "paragraph", text: "Quanta Loop is not responsible for:" },
          {
            kind: "list",
            items: [
              "third-party privacy practices;",
              "third-party content;",
              "or third-party systems.",
            ],
          },
          {
            kind: "paragraph",
            text: "Users should review the privacy policies of external services separately.",
          },
        ],
      },
      {
        title: "12. DISCLAIMERS",
        blocks: [
          { kind: "paragraph", text: "Users acknowledge and agree that:" },
          {
            kind: "list",
            items: [
              "internet transmissions may not always be secure;",
              "information shared online carries inherent risks;",
              "and use of the Platform is at the user's own discretion and risk.",
            ],
          },
          {
            kind: "paragraph",
            text: "While Quanta Loop takes reasonable measures to protect information, we do not guarantee absolute protection against unauthorised access, hacking, data loss or security breaches.",
          },
        ],
      },
      {
        title: "13. CHILDREN",
        blocks: [
          {
            kind: "paragraph",
            text: "The Platform is intended only for business and professional users who are at least 18 years of age.",
          },
          {
            kind: "paragraph",
            text: "Quanta Loop does not knowingly collect personal information from children.",
          },
        ],
      },
      {
        title: "14. CHANGES TO THIS PRIVACY POLICY",
        blocks: [
          {
            kind: "paragraph",
            text: "We may update or modify this Privacy Policy from time to time.",
          },
          {
            kind: "paragraph",
            text: 'Updated versions will be posted on the Platform with a revised "Last Updated" date.',
          },
          {
            kind: "paragraph",
            text: "Continued use of the Platform after updates constitutes acceptance of the revised Privacy Policy.",
          },
        ],
      },
      {
        title: "15. GOVERNING LAW & JURISDICTION",
        blocks: [
          {
            kind: "paragraph",
            text: "This Privacy Policy shall be governed by the laws of India.",
          },
          {
            kind: "paragraph",
            text: "Courts located in Chennai, Tamil Nadu shall have jurisdiction in relation to matters arising from this Privacy Policy, subject to applicable dispute resolution terms.",
          },
        ],
      },
      {
        title: "16. CONTACT US",
        blocks: [
          {
            kind: "paragraph",
            text: "For privacy-related queries or requests, please contact:",
          },
          { kind: "paragraph", text: ADDR },
          { kind: "email", label: "Email:" },
        ],
      },
    ],
  },
};

// Write English first
fs.writeFileSync(
  path.join(outDir, "legal.en.json"),
  JSON.stringify(en, null, 2) + "\n",
  "utf8"
);

console.log("Wrote legal.en.json");
