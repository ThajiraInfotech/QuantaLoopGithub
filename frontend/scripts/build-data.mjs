import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

import { addListItems } from "./legal-list-items.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const data = {};
function add(en, hi, ta) {
  data[en] = { hi, ta };
}

// common, consent, titles
add("Operated by {operator}", "{operator} द्वारा संचालित", "{operator} மூலம் இயக்கப்படுகிறது");
add("Last Updated: {date}", "अंतिम अपडेट: {date}", "கடைசியாக புதுப்பிக்கப்பட்டது: {date}");
add("Back to home", "होम पर वापस जाएँ", "முகப்புக்குத் திரும்ப");
add("I agree to the", "मैं ", "நான் ");
add("Terms & Conditions", "नियम और शर्तें", "விதிமுறைகள் & நிபந்தனைகள்");
add("and", " और ", " மற்றும் ");
add("Privacy Policy", "गोपनीयता नीति", "தனியுரிமைக் கொள்கை");
add(".", "से सहमत हूँ।", "ஒப்புக்கொள்கிறேன்.");
add("Email:", "ईमेल:", "மின்னஞ்சல்:");
add("paragraph", "paragraph", "paragraph");
add("list", "list", "list");
add("email", "email", "email");

// section titles
add("1. ABOUT QUANTA LOOP", "1. QUANTA LOOP के बारे में", "1. QUANTA LOOP பற்றி");
add("2. IMPORTANT PLATFORM DISCLAIMER", "2. महत्वपूर्ण Platform अस्वीकरण", "2. முக்கிய Platform மறுப்பு");
add("3. ELIGIBILITY & USER ACCOUNTS", "3. पात्रता और उपयोगकर्ता खाते", "3. தகுதி & பயனர் கணக்குகள்");
add("3.1 Eligibility", "3.1 पात्रता", "3.1 தகுதி");
add("3.2 Registration", "3.2 पंजीकरण", "3.2 பதிவு");
add("3.3 Accuracy of Information", "3.3 जानकारी की शुद्धता", "3.3 தகவலின் துல்லியம்");
add("3.4 Account Security", "3.4 खाता सुरक्षा", "3.4 கணக்கு பாதுகாப்பு");
add("4. PLATFORM SERVICES & FEATURES", "4. Platform सेवाएँ और सुविधाएँ", "4. Platform சேவைகள் & அம்சங்கள்");
add("5. SUBSCRIPTIONS & PAYMENTS", "5. सदस्यता और भुगतान", "5. சந்தா & கட்டணங்கள்");
add("5.1 Subscription Fees", "5.1 सदस्यता शुल्क", "5.1 சந்தா கட்டணம்");
add("5.2 User Transactions", "5.2 उपयोगकर्ता लेनदेन", "5.2 பயனர் பரிவர்த்தனைகள்");
add("5.3 Refunds", "5.3 धनवापसी", "5.3 பணத்திரும்பப்பெறுதல்");
add("6. USER CONTENT & LISTINGS", "6. User Content और लिस्टिंग", "6. User Content & பட்டியல்கள்");
add("6.1 User Content", "6.1 User Content", "6.1 User Content");
add("6.2 License to Quanta Loop", "6.2 Quanta Loop को लाइसेंस", "6.2 Quanta Loop-க்கான உரிமம்");
add("6.3 Content Moderation", "6.3 सामग्री मॉडरेशन", "6.3 உள்ளடக்க moderation");
add("7. PROHIBITED ACTIVITIES", "7. निषिद्ध गतिविधियाँ", "7. தடைசெய்யப்பட்ட செயல்கள்");
add("8. PRIVACY, COOKIES & COMMUNICATIONS", "8. गोपनीयता, कुकीज़ और संचार", "8. தனியுரிமை, குக்கீகள் & தகவல்தொடர்பு");
add("9. INTELLECTUAL PROPERTY", "9. बौद्धिक संपदा", "9. அறிவுசார் சொத்து");
add("10. THIRD-PARTY SERVICES", "10. तृतीय-पक्ष सेवाएँ", "10. மூன்றாம் தரப்பு சேவைகள்");
add("11. DISCLAIMERS", "11. अस्वीकरण", "11. மறுப்புகள்");
add("11. THIRD-PARTY SERVICES", "11. तृतीय-पक्ष सेवाएँ", "11. மூன்றாம் தரப்பு சேவைகள்");
add("11.1 Platform Provided \"As Is\"", "11.1 Platform \"जैसा है\" आधार पर प्रदान", "11.1 Platform \"உள்ளபடியே\" வழங்கப்படுகிறது");
add("11.2 No Verification", "11.2 कोई सत्यापन नहीं", "11.2 சரிபார்ப்பு இல்லை");
add("11.3 No Environmental or Regulatory Responsibility", "11.3 कोई पर्यावरणीय या नियामक जिम्मेदारी नहीं", "11.3 சுற்றுச்சூழல் அல்லது முறைப்படுத்தல் பொறுப்பு இல்லை");
add("12. LIMITATION OF LIABILITY", "12. दायित्व की सीमा", "12. பொறுப்பின் வரம்பு");
add("13. INDEMNITY", "13. क्षतिपूर्ति", "13. indemnity");
add("14. ACCOUNT SUSPENSION & TERMINATION", "14. खाता निलंबन और समाप्ति", "14. கணக்கு இடைநிறுத்தம் & நிறுத்தம்");
add("15. DATA & ANALYTICS", "15. डेटा और विश्लेषण", "15. தரவு & பகுப்பாய்வு");
add("16. FORCE MAJEURE", "16. अप्रत्याशित घटना (Force Majeure)", "16. Force Majeure");
add("17. CHANGES TO THE PLATFORM OR TERMS", "17. Platform या Terms में परिवर्तन", "17. Platform அல்லது Terms மாற்றங்கள்");
add("18. GOVERNING LAW & DISPUTE RESOLUTION", "18. शासी कानून और विवाद समाधान", "18. governing law & dispute resolution");
add("19. CONTACT DETAILS", "19. संपर्क विवरण", "19. தொடர்பு விவரங்கள்");
add("2. INFORMATION WE COLLECT", "2. हम जो जानकारी एकत्र करते हैं", "2. நாங்கள் சேகரிக்கும் தகவல்");
add("2.1 Information You Provide", "2.1 आपके द्वारा प्रदान की गई जानकारी", "2.1 நீங்கள் வழங்கும் தகவல்");
add("2.2 Platform & Transaction Information", "2.2 Platform और लेनदेन संबंधी जानकारी", "2.2 Platform & பரிவர்த்தனை தகவல்");
add("2.3 Device & Technical Information", "2.3 डिवाइस और तकनीकी जानकारी", "2.3 சாதன & தொழில்நுட்ப தகவல்");
add("3. HOW WE USE INFORMATION", "3. हम जानकारी का उपयोग कैसे करते हैं", "3. தகவலை எவ்வாறு பயன்படுத்துகிறோம்");
add("4. COOKIES & ANALYTICS", "4. कुकीज़ और विश्लेषण", "4. குக்கீகள் & பகுப்பாய்வு");
add("5. COMMUNICATIONS", "5. संचार", "5. தகவல்தொடர்பு");
add("6. DATA SHARING & DISCLOSURE", "6. डेटा साझाकरण और प्रकटीकरण", "6. தரவு பகிர்வு & வெளிப்படுத்தல்");
add("7. USER CONTENT & PLATFORM RESPONSIBILITY", "7. User Content और Platform जिम्मेदारी", "7. User Content & Platform பொறுப்பு");
add("8. DATA RETENTION", "8. डेटा प्रतिधारण", "8. தரவு தக்கவைப்பு");
add("9. USER RIGHTS", "9. उपयोगकर्ता अधिकार", "9. பயனர் உரிமைகள்");
add("10. DATA SECURITY", "10. डेटा सुरक्षा", "10. தரவு பாதுகாப்பு");
add("12. DISCLAIMERS", "12. अस्वीकरण", "12. மறுப்புகள்");
add("13. CHILDREN", "13. बच्चे", "13. குழந்தைகள்");
add("14. CHANGES TO THIS PRIVACY POLICY", "14. इस गोपनीयता नीति में परिवर्तन", "14. இந்த தனியுரிமைக் கொள்கையில் மாற்றங்கள்");
add("15. GOVERNING LAW & JURISDICTION", "15. शासी कानून और अधिकार क्षेत्र", "15. governing law & jurisdiction");
add("16. CONTACT US", "16. हमसे संपर्क करें", "16. எங்களை தொடர்பு கொள்ளுங்கள்");

// intro & paragraphs
add("Welcome to Quanta Loop, a digital platform operated by ASM Fintech Private Limited (\"ASM Fintech\", \"Quanta Loop\", \"we\", \"our\", or \"us\").", "Quanta Loop में आपका स्वागत है, यह ASM Fintech Private Limited (\"ASM Fintech\", \"Quanta Loop\", \"we\", \"our\", या \"us\") द्वारा संचालित एक डिजिटल Platform है।", "Quanta Loop-க்கு வரவேற்கிறோம்; இது ASM Fintech Private Limited (\"ASM Fintech\", \"Quanta Loop\", \"we\", \"our\", அல்லது \"us\") மூலம் இயக்கப்படும் ஒரு டிஜிட்டல் Platform.");
add("These Terms & Conditions (\"Terms\") govern your access to and use of the Quanta Loop platform, website, software, applications and related services (collectively, the \"Platform\").", "ये नियम और शर्तें (\"Terms\") Quanta Loop Platform, वेबसाइट, सॉफ़्टवेयर, एप्लिकेशन और संबंधित सेवाओं (सामूहिक रूप से, \"Platform\") तक आपकी पहुँच और उपयोग को नियंत्रित करती हैं।", "இந்த விதிமுறைகள் & நிபந்தனைகள் (\"Terms\") Quanta Loop Platform, website, software, applications மற்றும் தொடர்புடைய சேவைகளுக்கு (ஒன்றாக, \"Platform\") உங்கள் அணுகல் மற்றும் பயன்பாட்டை நிர்வகிக்கின்றன.");
add("By registering, accessing or using the Platform, you agree to these Terms. If you do not agree, please do not use the Platform.", "Platform पर पंजीकरण, पहुँच या उपयोग करके, आप इन Terms से सहमत होते हैं। यदि आप सहमत नहीं हैं, तो कृपया Platform का उपयोग न करें।", "Platform-ஐ பதிவு செய்து, அணுகி அல்லது பயன்படுத்துவதன் மூலம், இந்த Terms-க்கு நீங்கள் ஒப்புக்கொள்கிறீர்கள். ஒப்புக்கொள்ளவில்லை என்றால், Platform-ஐ பயன்படுத்த வேண்டாம்.");
add("Quanta Loop is a technology-enabled intermediary platform that enables industrial waste generators to publish waste listings and allows aggregators, recyclers and related stakeholders to discover and express interest in such listings.", "Quanta Loop एक technology-enabled मध्यस्थ Platform है जो औद्योगिक अपशिष्ट उत्पादकों को अपशिष्ट लिस्टिंग प्रकाशित करने में सक्षम बनाता है और aggregators, recyclers तथा संबंधित हितधारकों को ऐसी लिस्टिंग खोजने और रुचि व्यक्त करने की अनुमति देता है।", "Quanta Loop என்பது தொழில்துறை கழிவு உற்பத்தியாளர்கள் கழிவு பட்டியல்களை வெளியிடவும், aggregators, recyclers மற்றும் தொடர்புடைய stakeholders அத்தகைய பட்டியல்களைக் கண்டறிந்து ஆர்வம் தெரிவிக்கவும் உதவும் technology-enabled intermediary Platform ஆகும்.");
add("The Platform may provide:", "Platform प्रदान कर सकता है:", "Platform வழங்கக்கூடும்:");
add("Users may independently communicate and negotiate with each other regarding:", "उपयोगकर्ता स्वतंत्र रूप से एक-दूसरे के साथ संवाद और बातचीत कर सकते हैं, संबंध में:", "பயனர்கள் பின்வருவன தொடர்பாக த independently தகவல் பரிமாறி பேச்சுவார்த்தை நடத்தலாம்:");
add("Quanta Loop is ONLY a technology intermediary platform.", "Quanta Loop केवल एक technology मध्यस्थ Platform है।", "Quanta Loop என்பது technology intermediary Platform மட்டுமே.");
add("Quanta Loop is NOT:", "Quanta Loop यह नहीं है:", "Quanta Loop இவை அல்ல:");
add("Quanta Loop does NOT:", "Quanta Loop यह नहीं करता:", "Quanta Loop இவற்றைச் செய்யாது:");
add("All transactions and dealings occur directly between users at their own discretion and risk.", "सभी लेनदेन और व्यवहार उपयोगकर्ताओं के बीच सीधे उनके अपने विवेक और जोखिम पर होते हैं।", "அனைத்து பரிவர்த்தனைகளும் Dealings-உம் பயனர்களுக்கிடையே நேரடியாக அவர்களின் சொந்த விருப்பத்திற்கும் ஆபத்திற்கும் உட்பட்டு நடக்கின்றன.");
add("All responsibility relating to:", "से संबंधित सभी जिम्मेदारी:", "பின்வருவன தொடர்பான அனைத்து பொறுப்பும்:");
add("shall remain solely between the concerned users.", "केवल concerned users के बीच ही रहेगी।", "concerned usersக்கிடையே மட்டுமே இருக்கும்.");
add("Users are solely responsible for:", "उपयोगकर्ता पूर्णतः जिम्मेदार हैं:", "பயனர்கள் முழுவதும் பொறுப்பு:");
add("Quanta Loop does not independently verify user information, licences, permits, certifications, GST details or environmental approvals.", "Quanta Loop उपयोगकर्ता जानकारी, licences, permits, certifications, GST details या environmental approvals की स्वतंत्र रूप से पुष्टि नहीं करता।", "Quanta Loop பயனர் தகவல், licences, permits, certifications, GST details அல்லது environmental approvals-ஐ independently verify செய்யாது.");
add("The Platform is intended for business and professional users who are at least 18 years old and legally capable of entering into binding contracts.", "Platform व्यावसायिक और पेशेवर उपयोगकर्ताओं के लिए है जो कम से कम 18 वर्ष के हैं और कानूनी रूप से binding अनुबंधों में प्रवेश करने में सक्षम हैं।", "Platform வணிக மற்றும் professional பயனர்களுக்காக உள்ளது; அவர்கள் குறைந்தது 18 வயதுடையவர்களாகவும், binding contracts-ஐ செய்ய சட்டப்படி தகுதியுடையவர்களாகவும் இருக்க வேண்டும்.");
add("Users may register using:", "उपयोगकर्ता पंजीकरण कर सकते हैं:", "பயனர்கள் பின்வருவன மூலம் பதிவு செய்யலாம்:");
add("Users are responsible for maintaining confidentiality of account credentials and for activities occurring through their accounts.", "उपयोगकर्ता खाता credentials की गोपनीयता बनाए रखने और अपने खातों के माध्यम से होने वाली गतिविधियों के लिए जिम्मेदार हैं।", "கணக்கு credentials-ஐ ரகசியமாக வைத்திருப்பதற்கும், அவர்களின் கணக்குகள் வழியாக நடக்கும் செயல்களுக்கும் பயனர்கள் பொறுப்பு.");
add("Current features may include:", "वर्तमान सुविधाएँ शामिल हो सकती हैं:", "தற்போதைய அம்சங்கள் பின்வருவனவற்றை உள்ளடக்கலாம்:");
add("Future features may include:", "भविष्य की सुविधाएँ शामिल हो सकती हैं:", "எதிர்கால அம்சங்கள் பின்வருவனவற்றை உள்ளடக்கலாம்:");
add("Quanta Loop reserves the right to modify, suspend, discontinue or introduce features at any time without prior notice.", "Quanta Loop बिना पूर्व सूचना के किसी भी समय सुविधाओं को संशोधित, निलंबित, बंद या पेश करने का अधिकार सुरक्षित रखता है।", "Quanta Loop முன் அறிவிப்பின்றி எந்த நேரத்திலும் அம்சங்களை மாற்ற, இடைநிறுத்த, நிறுத்த அல்லது அறிமுகப்படுத்த உரிமை கொண்டுள்ளது.");
add("Certain features of the Platform may require payment of subscription or access fees.", "Platform की कुछ सुविधाओं के लिए subscription या access fees का भुगतान आवश्यक हो सकता है।", "Platform-ன் சில அம்சங்களுக்கு subscription அல்லது access fees செலுத்த வேண்டியிருக்கலாம்.");
add("Applicable pricing and plans may be updated periodically.", "लागू pricing और plans समय-समय पर अपडेट किए जा सकते हैं।", "பொருந்தும் pricing மற்றும் plans அவ்வப்போது புதுப்பிக்கப்படலாம்.");
add("Commercial transactions between users occur independently outside the Platform.", "उपयोगकर्ताओं के बीच व्यावसायिक लेनदेन Platform के बाहर स्वतंत्र रूप से होते हैं।", "பயனர்களுக்கிடையிலான commercial transactions Platform-க்கு வெளியே independently நடக்கின்றன.");
add("Quanta Loop is not a party to transactions between users and shall not be responsible for:", "Quanta Loop उपयोगकर्ताओं के बीच लेनदेन का पक्ष नहीं है और जिम्मेदार नहीं होगा:", "Quanta Loop பயனர்களுக்கிடையிலான transactions-இல் party அல்ல; பின்வருவனவற்றுக்கு பொறுப்பு இல்லை:");
add("Unless expressly stated otherwise, subscription fees are non-refundable.", "जब तक स्पष्ट रूप से अन्यथा न कहा जाए, subscription fees non-refundable हैं।", "வெளிப்படையாக வேறு குறிப்பிடப்படாவிட்டால், subscription fees திரும்பப் பெற முடியாது.");
add("Users may upload:", "उपयोगकर्ता upload कर सकते हैं:", "பயனர்கள் upload செய்யலாம்:");
add("Users remain responsible for all User Content uploaded or shared through the Platform.", "Platform के माध्यम से upload या share किए गए सभी User Content के लिए उपयोगकर्ता जिम्मेदार रहते हैं।", "Platform வழியாக upload அல்லது share செய்யப்பட்ட அனைத்து User Content-க்கும் பயனர்கள் பொறுப்பு.");
add("Users grant Quanta Loop a worldwide, non-exclusive, royalty-free license to:", "उपयोगकर्ता Quanta Loop को worldwide, non-exclusive, royalty-free license प्रदान करते हैं:", "பயனர்கள் Quanta Loop-க்கு worldwide, non-exclusive, royalty-free license வழங்குகின்றனர்:");
add("for purposes relating to:", "से संबंधित उद्देश्यों के लिए:", "பின்வரும் நோக்கங்களுக்காக:");
add("Quanta Loop may:", "Quanta Loop कर सकता है:", "Quanta Loop செய்யலாம்:");
add("where it reasonably believes such action is necessary for platform integrity, safety or legal compliance.", "जहाँ यह reasonably मानता है कि platform integrity, safety या legal compliance के लिए ऐसी कार्रवाई आवश्यक है।", "platform integrity, safety அல்லது legal compliance-க்கு அத்தகைய action தேவை என்று reasonably நம்பும் போது.");
add("Users shall not:", "उपयोगकर्ता नहीं करेंगे:", "பயனர்கள் செய்யக்கூடாது:");
add("Quanta Loop reserves the right to investigate and take action against violations.", "Quanta Loop उल्लंघनों की जाँच करने और कार्रवाई करने का अधिकार सुरक्षित रखता है।", "Quanta Loop மீறல்களை விசாரித்து action எடுக்க உரிமை கொண்டுள்ளது.");
add("By using the Platform, users consent to:", "Platform का उपयोग करके, उपयोगकर्ता सहमति देते हैं:", "Platform-ஐ பயன்படுத்துவதன் மூலம், பயனர்கள் ஒப்புதல் அளிக்கின்றனர்:");
add("Users may opt out of promotional communications where applicable.", "उपयोगकर्ता जहाँ लागू हो, promotional communications से opt out कर सकते हैं।", "பொருந்தும் இடங்களில் promotional communications-லிருந்து opt out செய்யலாம்.");
add("Users acknowledge that certain essential service communications may still be sent.", "उपयोगकर्ता स्वीकार करते हैं कि कुछ essential service communications अभी भी भेजी जा सकती हैं।", "சில essential service communications இன்னும் அனுப்பப்படலாம் என்பதை பயனர்கள் ஒப்புக்கொள்கின்றனர்.");
add("All rights relating to:", "से संबंधित सभी अधिकार:", "பின்வருவன தொடர்பான அனைத்து உரிமைகளும்:");
add("belong exclusively to ASM Fintech Private Limited or its licensors.", "विशेष रूप से ASM Fintech Private Limited या उसके licensors के पास हैं।", "ASM Fintech Private Limited அல்லது அதன் licensors-க்கு exclusively சொந்தமானவை.");
add("any part of the Platform without prior written permission.", "Platform के किसी भी भाग को prior written permission के बिना।", "Platform-ன் எந்தப் பகுதியையும் prior written permission இல்லாமல்.");
add("The Platform may integrate with third-party services, tools or software.", "Platform third-party services, tools या software के साथ integrate हो सकता है।", "Platform third-party services, tools அல்லது software-உடன் integrate ஆகலாம்.");
add("Quanta Loop is not responsible for:", "Quanta Loop जिम्मेदार नहीं है:", "Quanta Loop பொறுப்பு இல்லை:");
add("Use of third-party services may be subject to separate terms and policies.", "Third-party services का उपयोग अलग terms और policies के अधीन हो सकता है।", "Third-party services பயன்பாடு தனி terms மற்றும் policies-க்கு உட்பட்டதாக இருக்கலாம்.");
add("The Platform is provided on an \"as is\" and \"as available\" basis.", "Platform \"as is\" और \"as available\" आधार पर प्रदान किया जाता है।", "Platform \"as is\" மற்றும் \"as available\" அடிப்படையில் வழங்கப்படுகிறது.");
add("Quanta Loop does not guarantee:", "Quanta Loop guarantee नहीं करता:", "Quanta Loop உத்தரவாதம் அளிக்காது:");
add("Quanta Loop does not independently verify:", "Quanta Loop स्वतंत्र रूप से verify नहीं करता:", "Quanta Loop independently verify செய்யாது:");
add("Users interact and transact entirely at their own risk.", "उपयोगकर्ता पूर्णतः अपने जोखिम पर interact और transact करते हैं।", "பயனர்கள் entirely தங்கள் சொந்த ஆபத்தில் interact மற்றும் transact செய்கின்றனர்.");
add("Quanta Loop shall not be responsible for:", "Quanta Loop जिम्मेदार नहीं होगा:", "Quanta Loop பொறுப்பு இல்லை:");
add("To the maximum extent permitted by law, Quanta Loop, ASM Fintech Private Limited and their directors, employees, affiliates and representatives shall not be liable for:", "कानून द्वारा अनुमत अधिकतम सीमा तक, Quanta Loop, ASM Fintech Private Limited और उनके directors, employees, affiliates और representatives जिम्मेदार नहीं होंगे:", "சட்டம் அனுமதிக்கும் அதிகபட்ச அளவ까지, Quanta Loop, ASM Fintech Private Limited மற்றும் அவர்களின் directors, employees, affiliates மற்றும் representatives பொறுப்பு இல்லை:");
add("The total aggregate liability of Quanta Loop arising out of or relating to the Platform shall not exceed the subscription fees paid by the concerned user to Quanta Loop during the preceding three (3) months.", "Platform से उत्पन्न या संबंधित Quanta Loop की कुल aggregate liability concerned user द्वारा पिछले तीन (3) महीनों में Quanta Loop को भुगतान subscription fees से अधिक नहीं होगी।", "Platform-இலிருந்து எழும் அல்லது தொடர்புடைய Quanta Loop-ன் மொத்த aggregate liability, concerned user கடந்த மூன்று (3) மாதங்களில் Quanta Loop-க்கு செலுத்திய subscription fees-ஐ விட அதிகமாக இருக்காது.");
add("Users agree to defend, indemnify and hold harmless:", "उपयोगकर्ता defend, indemnify और hold harmless करने के लिए सहमत हैं:", "பயனர்கள் defend, indemnify மற்றும் hold harmless செய்ய ஒப்புக்கொள்கின்றனர்:");
add("against any claims, liabilities, damages, penalties, losses or expenses arising from:", "से उत्पन्न किसी भी claims, liabilities, damages, penalties, losses या expenses के विरुद्ध:", "பின்வருவனவற்றிலிருந்து எழும் claims, liabilities, damages, penalties, losses அல்லது expenses-க்கு எதிராக:");
add("Quanta Loop may suspend, restrict or terminate accounts at its discretion where:", "Quanta Loop अपने विवेक से accounts suspend, restrict या terminate कर सकता है जहाँ:", "Quanta Loop தனது விருப்பப்படி accounts-ஐ suspend, restrict அல்லது terminate செய்யலாம், இங்கு:");
add("Quanta Loop may also remove content or restrict platform access without prior notice where reasonably necessary.", "Quanta Loop reasonably आवश्यक होने पर prior notice के बिना content हटा या platform access restrict भी कर सकता है।", "reasonably தேவைப்படும் போது Quanta Loop முன் அறிவிப்பின்றி content-ஐ நீக்கவும் platform access-ஐ restrict செய்யவும் கூடும்.");
add("Quanta Loop may use aggregated, anonymised or non-identifiable usage data for:", "Quanta Loop aggregated, anonymised या non-identifiable usage data का उपयोग कर सकता है:", "Quanta Loop aggregated, anonymised அல்லது non-identifiable usage data-ஐ பின்வருவனவற்றுக்காக பயன்படுத்தலாம்:");
add("Quanta Loop shall not be liable for delays or failures caused by events beyond reasonable control including:", "Quanta Loop reasonable control से परे की घटनाओं के कारण delays या failures के लिए liable नहीं होगा, जिनमें शामिल हैं:", "reasonable control-க்கு அப்பாற்பட்ட நிகழ்வுகளால் ஏற்படும் delays அல்லது failures-க்கு Quanta Loop liable அல்ல, அவை:");
add("at any time.", "किसी भी समय।", "எந்த நேரத்திலும்.");
add("Updated Terms will be posted on the Platform with a revised \"Last Updated\" date.", "अपडेटेड Terms Platform पर revised \"Last Updated\" date के साथ पोस्ट किए जाएँगे।", "புதுப்பிக்கப்பட்ட Terms revised \"Last Updated\" date உடன் Platform-இல் வெளியிடப்படும்.");
add("Continued use of the Platform after updates constitutes acceptance of revised Terms.", "अपडेट के बाद Platform का निरंतर उपयोग revised Terms की स्वीकृति है।", "புதுப்பிப்புகளுக்குப் பிறகு Platform-ஐ தொடர்ந்து பயன்படுத்துவது revised Terms-ஐ ஏற்றுக்கொள்வதாகும்.");
add("These Terms shall be governed by the laws of India.", "ये Terms India के कानूनों द्वारा governed होंगे।", "இந்த Terms India-ன் சட்டங்களால் governed ஆகும்.");
add("Any dispute arising from or relating to these Terms shall be referred to arbitration seated in Chennai under the Arbitration and Conciliation Act, 1996.", "इन Terms से उत्पन्न या संबंधित कोई भी dispute Chennai में Arbitration and Conciliation Act, 1996 के तहत arbitration के लिए referred किया जाएगा।", "இந்த Terms-இலிருந்து எழும் அல்லது தொடர்புடைய எந்த dispute-யும் Chennai-இல் Arbitration and Conciliation Act, 1996-க்குட்பட்ட arbitration-க்கு referred செய்யப்படும்.");
add("The arbitration shall be conducted by a sole arbitrator appointed by Quanta Loop.", "Arbitration Quanta Loop द्वारा नियुक्त sole arbitrator द्वारा conducted होगी।", "Arbitration Quanta Loop நியமிக்கும் sole arbitrator மூலம் conducted செய்யப்படும்.");
add("The language of arbitration shall be English.", "Arbitration की language English होगी।", "Arbitration-ன் language English ஆக இருக்கும்.");
add("Courts at Chennai shall have exclusive jurisdiction for interim or injunctive relief.", "Chennai की Courts interim या injunctive relief के लिए exclusive jurisdiction रखेंगी।", "Chennai Courts interim அல்லது injunctive relief-க்கு exclusive jurisdiction கொண்டிருக்கும்.");

// privacy intro & paragraphs
add("ASM Fintech Private Limited (\"ASM Fintech\", \"Quanta Loop\", \"we\", \"our\", or \"us\") respects your privacy and is committed to protecting your personal information.", "ASM Fintech Private Limited (\"ASM Fintech\", \"Quanta Loop\", \"we\", \"our\", या \"us\") आपकी privacy का सम्मान करता है और आपकी personal information की सुरक्षा के लिए committed है।", "ASM Fintech Private Limited (\"ASM Fintech\", \"Quanta Loop\", \"we\", \"our\", அல்லது \"us\") உங்கள் privacy-ஐ மதிக்கிறது; உங்கள் personal information-ஐ பாதுகாப்பதில் committed.");
add("This Privacy Policy explains how Quanta Loop collects, uses, stores, shares and protects information when you access or use the Quanta Loop platform, website, applications, products or related services (collectively, the \"Platform\").", "यह गोपनीयता नीति बताती है कि Quanta Loop Quanta Loop Platform, website, applications, products या related services (सामूहिक रूप से, \"Platform\") तक access या use करने पर information कैसे collect, use, store, share और protect करता है।", "இந்த தனியுரிமைக் கொள்கை Quanta Loop Platform, website, applications, products அல்லது related services (ஒன்றாக, \"Platform\")-ஐ access/use செய்யும்போது information-ஐ எவ்வாறு collect, use, store, share, protect செய்கிறது என்பதை விளக்குகிறது.");
add("By accessing or using the Platform, you agree to this Privacy Policy.", "Platform access या use करके, आप इस Privacy Policy से सहमत होते हैं।", "Platform-ஐ access/use செய்வதன் மூலம், இந்த Privacy Policy-க்கு நீங்கள் ஒப்புக்கொள்கிறீர்கள்.");
add("Quanta Loop is a technology-enabled intermediary platform that facilitates connections between industrial waste generators, aggregators, recyclers and related stakeholders.", "Quanta Loop एक technology-enabled intermediary Platform है जो industrial waste generators, aggregators, recyclers और related stakeholders के बीच connections facilitate करता है।", "Quanta Loop என்பது industrial waste generators, aggregators, recyclers மற்றும் related stakeholders-க்கிடையே connections-ஐ எளிதாக்கும் technology-enabled intermediary Platform.");
add("Quanta Loop acts only as a technology platform/intermediary.", "Quanta Loop केवल technology platform/intermediary के रूप में कार्य करता है।", "Quanta Loop technology platform/intermediary ஆக மட்டும் செயல்படுகிறது.");
add("Information displayed or shared on the Platform is generally provided directly by users. Quanta Loop does not independently verify all user-submitted information, listings, claims, certifications, quantities, pricing, business credentials or representations.", "Platform पर display या share की गई information आमतौर पर users द्वारा directly प्रदान की जाती है। Quanta Loop सभी user-submitted information, listings, claims, certifications, quantities, pricing, business credentials या representations की independently verify नहीं करता।", "Platform-இல் display/share செய்யப்படும் information பொதுவாக users நேரடியாக வழங்குகின்றனர். Quanta Loop அனைத்து user-submitted information, listings, claims, certifications, quantities, pricing, business credentials அல்லது representations-ஐயும் independently verify செய்யாது.");
add("Users are responsible for independently evaluating and verifying counterparties and transactions.", "Users counterparties और transactions की independently evaluate और verify करने के लिए जिम्मेदार हैं।", "counterparties மற்றும் transactions-ஐ independently evaluate/verify செய்வதற்கு users பொறுப்பு.");
add("When you register or use the Platform, you may provide:", "जब आप Platform register या use करते हैं, तो provide कर सकते हैं:", "Platform-ஐ register/use செய்யும்போது, வழங்கலாம்:");
add("We may collect information relating to:", "हम information collect कर सकते हैं, संबंध में:", "பின்வருவன தொடர்பான information-ஐ சேகரிக்கலாம்:");
add("We may automatically collect:", "हम automatically collect कर सकते हैं:", "automatically சேகரிக்கலாம்:");
add("We may use information for purposes including:", "हम information का उपयोग purposes सहित कर सकते हैं:", "information-ஐ பின்வரும் நோக்கங்களுக்காக பயன்படுத்தலாம்:");
add("Quanta Loop may use:", "Quanta Loop उपयोग कर सकता है:", "Quanta Loop பயன்படுத்தலாம்:");
add("to improve functionality, understand user behaviour and enhance platform performance.", "functionality improve करने, user behaviour समझने और platform performance enhance करने के लिए।", "functionality மேம்படுத்த, user behaviour புரிந்துகொள்ள, platform performance enhance செய்ய.");
add("These technologies may help us:", "ये technologies हमारी मदद कर सकती हैं:", "இந்த technologies உதவலாம்:");
add("Users may disable cookies through browser or device settings. However, certain features of the Platform may not function properly if cookies are disabled.", "Users browser या device settings के माध्यम से cookies disable कर सकते हैं। हालाँकि, cookies disabled होने पर Platform की कुछ features properly function नहीं कर सकतीं।", "browser/device settings மூலம் cookies disable செய்யலாம். cookies disable செய்தால் Platform-ன் சில features properly function செய்யாது.");
add("By using the Platform, you consent to receive:", "Platform use करके, receive करने की consent देते हैं:", "Platform பயன்படுத்துவதன் மூலம், பெற ஒப்புதல்:");
add("You may opt out of promotional communications at any time using unsubscribe links or by contacting us. However, essential service-related communications may still be sent.", "Unsubscribe links या हमसे contact करके किसी भी समय promotional communications से opt out कर सकते हैं। हालाँकि, essential service-related communications अभी भी भेजी जा सकती हैं।", "unsubscribe links அல்லது எங்களை தொடர்பு கொண்டு anytime promotional communications-லிருந்து opt out செய்யலாம். essential service-related communications இன்னும் அனுப்பப்படலாம்.");
add("We may share information with:", "हम information share कर सकते हैं:", "information பகிரலாம்:");
add("For example, certain business or listing information may be visible to other users to facilitate transactions and platform interactions.", "उदाहरण के लिए, कुछ business या listing information transactions और platform interactions facilitate करने के लिए other users को visible हो सकती है।", "எ.கா., transactions மற்றும் platform interactions-ஐ எளிதாக்க சில business/listing information மற்ற users-க்கு visible ஆகலாம்.");
add("We do not sell personal data to third parties.", "हम personal data third parties को sell नहीं करते।", "personal data-ஐ third parties-க்கு விற்க மாட்டோம்.");
add("Quanta Loop does not guarantee the accuracy, completeness or reliability of user-generated content or third-party information.", "Quanta Loop user-generated content या third-party information की accuracy, completeness या reliability guarantee नहीं करता।", "Quanta Loop user-generated content/third-party information-ன் accuracy, completeness/reliability-க்கு guarantee இல்லை.");
add("We retain information for as long as reasonably necessary for:", "हम information reasonably necessary period तक retain करते हैं:", "reasonably தேவையான காலம் information-ஐ retain செய்வோம்:");
add("Certain information may continue to be retained where required by law or for operational, security or compliance purposes.", "कुछ information law द्वारा required होने या operational, security या compliance purposes के लिए retain होती रह सकती है।", "சில information சட்டம் தேவைப்படும்போது அல்லது operational, security/compliance purposes-க்காக retain செய்யப்படலாம்.");
add("Subject to applicable law, users may request to:", "Applicable law के अधीन, users request कर सकते हैं:", "applicable law-க்கு உட்பட்டு, users கோரலாம்:");
add("Requests may be submitted to:", "Requests submit की जा सकती हैं:", "Requests submit செய்யலாம்:");
add("We may retain certain information where required for:", "हम कुछ information retain कर सकते हैं जहाँ required:", "தேவைப்படும் இடங்களில் சில information retain செய்வோம்:");
add("We implement commercially reasonable safeguards to help protect information, including:", "हम commercially reasonable safeguards implement करते हैं information protect करने के लिए, including:", "information பாதுகாக்க commercially reasonable safeguards-ஐ implement செய்கிறோம், including:");
add("However, no method of internet transmission or electronic storage is completely secure.", "हालाँकि, internet transmission या electronic storage का कोई method completely secure नहीं है।", "internet transmission/electronic storage முறை completely secure அல்ல.");
add("Accordingly, we cannot guarantee absolute security of information.", "अतः, हम information की absolute security guarantee नहीं कर सकते।", "எனவே, information-ன் absolute security-க்கு guarantee அளிக்க முடியாது.");
add("The Platform may integrate with or contain links to third-party services, tools or websites.", "Platform third-party services, tools या websites के links integrate या contain कर सकता है।", "Platform third-party services, tools/websites links-ஐ integrate/contain செய்யலாம்.");
add("Users should review the privacy policies of external services separately.", "Users external services की privacy policies separately review करें।", "external services-ன் privacy policies-ஐ users த separately review செய்ய வேண்டும்.");
add("Users acknowledge and agree that:", "Users acknowledge और agree करते हैं कि:", "users acknowledge/ agree:");
add("While Quanta Loop takes reasonable measures to protect information, we do not guarantee absolute protection against unauthorised access, hacking, data loss or security breaches.", "Quanta Loop information protect करने के reasonable measures लेता है, हम unauthorised access, hacking, data loss या security breaches के against absolute protection guarantee नहीं करते।", "Quanta Loop reasonable measures எடுத்தாலும், unauthorised access, hacking, data loss/security breaches-க்கு absolute protection guarantee இல்லை.");
add("The Platform is intended only for business and professional users who are at least 18 years of age.", "Platform केवल कम से कम 18 years age के business और professional users के लिए है।", "Platform குறைந்தது 18 years age உடைய business/professional users-க்கு மட்டும்.");
add("Quanta Loop does not knowingly collect personal information from children.", "Quanta Loop knowingly children से personal information collect नहीं करता।", "Quanta Loop knowingly children-இலிருந்து personal information collect செய்யாது.");
add("We may update or modify this Privacy Policy from time to time.", "हम इस Privacy Policy को time to time update या modify कर सकते हैं।", "இந்த Privacy Policy-ஐ time to time update/modify செய்யலாம்.");
add("Updated versions will be posted on the Platform with a revised \"Last Updated\" date.", "Updated versions Platform पर revised \"Last Updated\" date के साथ post होंगे।", "Updated versions revised \"Last Updated\" date உடன் Platform-இல் post செய்யப்படும்.");
add("Continued use of the Platform after updates constitutes acceptance of the revised Privacy Policy.", "Updates के बाद Platform का continued use revised Privacy Policy की acceptance है।", "updates-க்குப் பிறகு Platform-ஐ தொடர்ந்து பயன்படுத்துவது revised Privacy Policy acceptance.");
add("This Privacy Policy shall be governed by the laws of India.", "यह Privacy Policy India के laws द्वारा governed होगी।", "இந்த Privacy Policy India-ன் laws-ஆல் governed.");
add("Courts located in Chennai, Tamil Nadu shall have jurisdiction in relation to matters arising from this Privacy Policy, subject to applicable dispute resolution terms.", "Chennai, Tamil Nadu में located Courts इस Privacy Policy से arising matters के relation में jurisdiction रखेंगी, applicable dispute resolution terms के अधीन।", "Chennai, Tamil Nadu-இல் located Courts, applicable dispute resolution terms-க்கு உட்பட்டு, இந்த Privacy Policy-இலிருந்து எழும் matters-க்கு jurisdiction கொண்டிருக்கும்.");
add("For privacy-related queries or requests, please contact:", "Privacy-related queries या requests के लिए, contact करें:", "privacy-related queries/requests-க்கு, தொடர்பு கொள்ளுங்கள்:");

addListItems(add);

const en = JSON.parse(
  fs.readFileSync(path.join(__dirname, "..", "messages", "partials", "legal.en.json"), "utf8")
);
const required = new Set();
function collectStrings(value, out) {
  if (typeof value === "string") {
    if (value !== "LEGAL_COMPANY_ADDRESS") out.add(value);
  } else if (Array.isArray(value)) value.forEach((v) => collectStrings(v, out));
  else if (value && typeof value === "object") Object.values(value).forEach((v) => collectStrings(v, out));
}
collectStrings(en, required);

const missing = [...required].filter((s) => !(s in data)).sort();
if (missing.length) {
  fs.writeFileSync(path.join(__dirname, "_missing.json"), JSON.stringify(missing, null, 2));
  console.error("Missing translations:", missing.length);
  process.exit(1);
}

fs.writeFileSync(
  path.join(__dirname, "legal-translations-data.json"),
  JSON.stringify(data, null, 2) + "\n"
);
console.log("Entries:", Object.keys(data).length);
