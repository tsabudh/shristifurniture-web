// Original copy. Structure (lead -> numbered process -> materials -> CTA) is a common pattern for service pages.
export const SERVICES = [
  {
    slug: 'made-to-order', images: ['services/made-to-order'],
    en: { title: 'Made-to-Order Furniture', short: 'Any piece, built to your size, wood and finish.',
      lead: 'Cannot find the exact size or style in the showroom? Show us a photo, a sketch or just the measurements of your room, and our workshop will build it for you.',
      steps: [['Tell us what you need','Visit the showroom or send photos and measurements on WhatsApp. We ask about the room, the people using it and your budget.'],['Design & quote','We agree the shape, wood, finish and fabric with you, then give a clear written price and delivery date.'],['We build it','Seasoned wood is cut, joined and sanded in our workshop. We send you progress photos before the final polish.'],['Delivery & fitting','We deliver, set up and fit the piece in your room, and take away the packing.']],
      materialsTitle: 'Materials we work with', materials: ['Seasoned local hardwood and softwood','Plywood, MDF and laminates for wardrobes and kitchens','Steel and metal fittings','Fabric, leatherette and foam for seating','Glass and mirror for tops and doors']},
    ne: { title: 'नापअनुसार बनाइने फर्निचर', short: 'जुनसुकै फर्निचर, तपाईँको नाप, काठ र फिनिशमा।',
      lead: 'शोरुममा चाहेको नाप वा शैली भेटिएन? फोटो, स्केच वा कोठाको नाप मात्र देखाउनुहोस्, हाम्रो कार्यशालाले तपाईँका लागि बनाइदिन्छ।',
      steps: [['के चाहिन्छ भन्नुहोस्','शोरुममा आउनुहोस् वा व्हाट्सएपमा फोटो र नाप पठाउनुहोस्। हामी कोठा, प्रयोगकर्ता र बजेटबारे सोध्छौँ।'],['डिजाइन र मूल्य','आकार, काठ, फिनिश र कपडा तपाईँसँग मिलाएर स्पष्ट लिखित मूल्य र डेलिभरी मिति दिन्छौँ।'],['हामी बनाउँछौँ','कार्यशालामा सुकेको काठ काटिन्छ, जोडिन्छ र घोटिन्छ। अन्तिम पालिशअघि प्रगतिका फोटो पठाउँछौँ।'],['डेलिभरी र जडान','हामी फर्निचर ल्याएर तपाईँको कोठामा जडान गर्छौँ र प्याकिङका सामान लैजान्छौँ।']],
      materialsTitle: 'हामीले प्रयोग गर्ने सामग्री', materials: ['सुकेको स्थानीय कडा र नरम काठ','वार्डरोब र किचनका लागि प्लाइउड, एमडीएफ र ल्यामिनेट','स्टिल र धातुका फिटिङ','सिटका लागि कपडा, लेदरेट र फोम','टप र ढोकाका लागि सिसा र ऐना']}
  },
  {
    slug: 'modular-kitchen-wardrobe', images: ['services/modular-kitchen','services/modular-wardrobe'],
    en: { title: 'Modular Kitchen & Wardrobe Design', short: 'Fitted kitchens and wardrobes planned around your room.',
      lead: 'Fitted units make the most of every centimetre. We measure your room, plan the layout, and fit units that open smoothly and last through years of daily use.',
      steps: [['Site visit & measure','We measure walls, windows, pipes and sockets so nothing clashes later.'],['Layout & drawings','You see a layout with the position of each cabinet, drawer and shelf before anything is cut.'],['Choose finishes','Pick the carcass, shutter finish, handles and countertop. Moisture-resistant boards are used in kitchens.'],['Fitting','Units are assembled and fitted on site, with hinges and channels adjusted until doors close cleanly.']],
      materialsTitle: 'Options', materials: ['Moisture-resistant plywood and board for kitchens','Laminate, acrylic or painted shutters','Soft-close hinges and drawer channels','Pull-out baskets, corner units and hanging rails','Glass, mirror or open-shelf sections']},
    ne: { title: 'मोड्युलर किचन र वार्डरोब डिजाइन', short: 'तपाईँको कोठाअनुसार योजना बनाइएका किचन र वार्डरोब।',
      lead: 'जडित युनिटले हरेक इन्चको सदुपयोग गर्छ। हामी कोठा नाप्छौँ, लेआउट बनाउँछौँ, र वर्षौँसम्म सजिलै खुल्ने बलियो युनिट जडान गर्छौँ।',
      steps: [['साइट भ्रमण र नाप','भित्ता, झ्याल, पाइप र सकेट नाप्छौँ ताकि पछि केही बाझिँदैन।'],['लेआउट र नक्सा','काट्नुअघि नै हरेक क्याबिनेट, दराज र सेल्फको स्थान देखाउने लेआउट हेर्न पाउनुहुन्छ।'],['फिनिश छान्नुहोस्','बडी, सटरको फिनिश, ह्यान्डल र काउन्टरटप रोज्नुहोस्। भान्सामा चिस्यान सहने बोर्ड प्रयोग गरिन्छ।'],['जडान','युनिट साइटमै जोडिन्छन् र ढोका सफासँग बन्द नहुँदासम्म हिन्ज र च्यानल मिलाइन्छ।']],
      materialsTitle: 'विकल्पहरू', materials: ['भान्साका लागि चिस्यान सहने प्लाइउड र बोर्ड','ल्यामिनेट, एक्रिलिक वा रङ गरिएका सटर','सफ्ट-क्लोज हिन्ज र दराज च्यानल','तान्न मिल्ने टोकरी, कुना युनिट र झुन्ड्याउने रड','सिसा, ऐना वा खुला सेल्फ भाग']}
  },
  {
    slug: 'repair-polish-paint', images: ['services/repair-polish'],
    en: { title: 'Repair, Polish & Painting', short: 'Give tired furniture a second life instead of replacing it.',
      lead: 'A loose joint, a scratched top or a faded finish does not mean the piece has to go. We repair, strip, polish or paint it, often for far less than a new one.',
      steps: [['Inspect','We look at the frame, joints and surface and tell you honestly what can be saved.'],['Strip & repair','Old finish is removed by hand and sanding. Broken joints are re-glued and missing parts replaced.'],['Colour & finish','Choose a natural stain, a clear polish or paint. We match an existing colour on request.'],['Polish & return','Several coats are applied and cured, then the piece is checked and returned to you.']],
      materialsTitle: 'Finishes', materials: ['Wood stain and clear polish','Melamine and PU lacquer, from matt to gloss','Enamel and wood paint in any colour','Hand-sanding for a smooth base','Touch-up for scratches and water marks']},
    ne: { title: 'मर्मत, पालिश र रङरोगन', short: 'थोत्रिएको फर्निचरलाई फेर्नुको सट्टा नयाँ जीवन दिनुहोस्।',
      lead: 'जोर्नी खुकुलो, माथिल्लो भागमा खरोँच वा फिनिश फिक्का भए पनि फर्निचर फाल्नुपर्दैन। हामी मर्मत, छाला निकाल्ने, पालिश वा रङ गर्छौँ, प्रायः नयाँ किन्नुभन्दा निकै सस्तोमा।',
      steps: [['जाँच','फ्रेम, जोर्नी र सतह हेरेर के जोगाउन सकिन्छ इमानदारीसाथ भन्छौँ।'],['पुरानो फिनिश हटाउने र मर्मत','पुरानो फिनिश हातले र घोटेर हटाइन्छ। भाँचिएका जोर्नी जोडिन्छन् र हराएका भाग फेरिन्छन्।'],['रङ र फिनिश','प्राकृतिक स्टेन, पारदर्शी पालिश वा रङ रोज्नुहोस्। अनुरोधमा पुरानै रङ मिलाइदिन्छौँ।'],['पालिश र फिर्ता','धेरै तह लगाएर सुकाइन्छ, जाँच गरेर तपाईँलाई फिर्ता दिइन्छ।']],
      materialsTitle: 'फिनिशहरू', materials: ['काठको स्टेन र पारदर्शी पालिश','मेलामाइन र पिउ ल्याकर, म्याटदेखि ग्लोससम्म','इनामेल र काठको रङ, जुनसुकै रङमा','चिल्लो आधारका लागि हातले घोट्ने काम','खरोँच र पानीका दाग मेट्ने काम']}
  },
  {
    slug: 'reupholstery', images: ['services/reupholstery'],
    en: { title: 'Re-upholstery', short: 'New fabric and fresh foam for sofas and chairs you already love.',
      lead: 'If the frame is still sound, new foam and fabric can make a sofa feel brand new. Bring a photo or visit us with a fabric swatch and we will quote on the spot.',
      steps: [['Check the frame','We test the wood frame and springs, and repair them if needed.'],['Choose fabric & foam','Pick fabric, leatherette or velvet and the foam firmness you prefer.'],['Strip & rebuild','The old cover and foam come off; new foam, webbing and cover are fitted and stitched.'],['Finish & deliver','Piping, buttons and legs are finished and the piece is delivered back to you.']],
      materialsTitle: 'Options', materials: ['Cotton, polyester, velvet and jacquard fabrics','Leatherette in plain and textured finishes','High-density foam in soft, medium and firm grades','Button-tufting and piping','New legs or wooden trims']},
    ne: { title: 'रि-अप्होल्स्ट्री (सोफा मर्मत)', short: 'मन पर्ने सोफा र कुर्सीलाई नयाँ कपडा र फोम।',
      lead: 'फ्रेम बलियो छ भने नयाँ फोम र कपडाले सोफालाई नयाँजस्तै बनाउँछ। फोटो ल्याउनुहोस् वा कपडाको नमुनासहित आउनुहोस्, हामी तुरुन्तै मूल्य बताउँछौँ।',
      steps: [['फ्रेम जाँच','काठको फ्रेम र स्प्रिङ जाँचिन्छ, चाहिए मर्मत गरिन्छ।'],['कपडा र फोम छान्नुहोस्','कपडा, लेदरेट वा मखमल र मनपर्ने कडापनको फोम रोज्नुहोस्।'],['पुरानो हटाएर नयाँ बनाउने','पुरानो खोल र फोम हटाइन्छ; नयाँ फोम, वेबिङ र खोल सिलेर जडान गरिन्छ।'],['फिनिश र फिर्ता','पाइपिङ, बटन र खुट्टा मिलाएर फर्निचर तपाईँलाई फिर्ता दिइन्छ।']],
      materialsTitle: 'विकल्पहरू', materials: ['सुती, पोलिएस्टर, मखमल र जकार्ड कपडा','सादा र बनावटयुक्त लेदरेट','नरम, मध्यम र कडा ग्रेडको उच्च घनत्व फोम','बटन-टफ्टिङ र पाइपिङ','नयाँ खुट्टा वा काठका किनारा']}
  },
  {
    slug: 'interior-fit-outs', images: ['services/home-interior','services/office-interior'],
    en: { title: 'Home & Office Interior Fit-outs', short: 'Furniture, partitions and fittings for a complete room or floor.',
      lead: 'For a new home, a renovated flat or an office floor, we can supply and fit everything made of wood: furniture, wall panels, partitions, ceilings and storage.',
      steps: [['Brief & budget','We understand how the space will be used and agree a budget and timeline.'],['Plan & drawings','Layouts and furniture drawings are prepared and checked against your site.'],['Make & install','Pieces are made in our workshop and installed in an agreed order to avoid disruption.'],['Handover','We do a final check with you and fix any snags before we hand over.']],
      materialsTitle: 'What we can fit', materials: ['Wardrobes, kitchens and study units','Wall panelling and TV walls','Wooden partitions and false ceilings','Reception counters, desks and workstations','Doors, windows and mandir units']},
    ne: { title: 'घर र कार्यालयको इन्टेरियर फिट-आउट', short: 'पूरै कोठा वा तल्लाका लागि फर्निचर, पार्टिसन र फिटिङ।',
      lead: 'नयाँ घर, नवीकरण गरिएको फ्ल्याट वा कार्यालयको तल्लाका लागि काठबाट बन्ने सबै सामान: फर्निचर, भित्ते प्यानल, पार्टिसन, सिलिङ र भण्डारण हामी आपूर्ति र जडान गर्छौँ।',
      steps: [['आवश्यकता र बजेट','ठाउँ कसरी प्रयोग हुन्छ बुझेर बजेट र समयसीमा तय गर्छौँ।'],['योजना र नक्सा','लेआउट र फर्निचरको नक्सा बनाएर तपाईँको साइटसँग मिलाइन्छ।'],['निर्माण र जडान','सामान कार्यशालामा बन्छन् र अवरोध नहुने क्रममा जडान गरिन्छन्।'],['हस्तान्तरण','हस्तान्तरणअघि तपाईँसँग अन्तिम जाँच गरी कमीकमजोरी मिलाउँछौँ।']],
      materialsTitle: 'हामीले जडान गर्न सक्ने', materials: ['वार्डरोब, किचन र अध्ययन युनिट','भित्ते प्यानल र टिभी वाल','काठका पार्टिसन र फल्स सिलिङ','रिसेप्सन काउन्टर, डेस्क र वर्कस्टेसन','ढोका, झ्याल र मन्दिर युनिट']}
  },
];
