import { TN_DISTRICTS } from "@/config/demo-config";

/**
 * Districts by state / union territory (best-effort, as commonly listed in 2024; district boundaries
 * and names change, so review against an official source before relying on it for anything formal).
 * Tamil Nadu reuses the application's existing TN_DISTRICTS list. Several states have districts that share a
 * name (e.g. Bilaspur, Aurangabad, Hamirpur); each entry therefore keeps its state.
 */
const split = (s: string) => s.split(",").map((x) => x.trim()).filter(Boolean);

export const DISTRICTS_BY_STATE: Record<string, string[]> = {
  "Andhra Pradesh": split("Alluri Sitharama Raju, Anakapalli, Ananthapuramu, Annamayya, Bapatla, Chittoor, Dr. B.R. Ambedkar Konaseema, East Godavari, Eluru, Guntur, Kakinada, Krishna, Kurnool, Nandyal, NTR, Palnadu, Parvathipuram Manyam, Prakasam, Sri Balaji, Sri Potti Sriramulu Nellore, Sri Sathya Sai, Srikakulam, Visakhapatnam, Vizianagaram, West Godavari, YSR Kadapa"),
  "Arunachal Pradesh": split("Anjaw, Changlang, Dibang Valley, East Kameng, East Siang, Kamle, Kra Daadi, Kurung Kumey, Lepa Rada, Lohit, Longding, Lower Dibang Valley, Lower Siang, Lower Subansiri, Namsai, Pakke-Kessang, Papum Pare, Shi Yomi, Siang, Tawang, Tirap, Upper Siang, Upper Subansiri, West Kameng, West Siang"),
  Assam: split("Bajali, Baksa, Barpeta, Biswanath, Bongaigaon, Cachar, Charaideo, Chirang, Darrang, Dhemaji, Dhubri, Dibrugarh, Dima Hasao, Goalpara, Golaghat, Hailakandi, Hojai, Jorhat, Kamrup, Kamrup Metropolitan, Karbi Anglong, Kokrajhar, Lakhimpur, Majuli, Morigaon, Nagaon, Nalbari, Sivasagar, Sonitpur, South Salmara-Mankachar, Sribhumi, Tamulpur, Tinsukia, Udalguri, West Karbi Anglong"),
  Bihar: split("Araria, Arwal, Aurangabad, Banka, Begusarai, Bhagalpur, Bhojpur, Buxar, Darbhanga, East Champaran, Gaya, Gopalganj, Jamui, Jehanabad, Kaimur, Katihar, Khagaria, Kishanganj, Lakhisarai, Madhepura, Madhubani, Munger, Muzaffarpur, Nalanda, Nawada, Patna, Purnia, Rohtas, Saharsa, Samastipur, Saran, Sheikhpura, Sheohar, Sitamarhi, Siwan, Supaul, Vaishali, West Champaran"),
  Chhattisgarh: split("Balod, Baloda Bazar, Balrampur, Bastar, Bemetara, Bijapur, Bilaspur, Dantewada, Dhamtari, Durg, Gariaband, Gaurela-Pendra-Marwahi, Janjgir-Champa, Jashpur, Kabirdham, Kanker, Khairagarh-Chhuikhadan-Gandai, Kondagaon, Korba, Koriya, Mahasamund, Manendragarh-Chirmiri-Bharatpur, Mohla-Manpur-Ambagarh Chowki, Mungeli, Narayanpur, Raigarh, Raipur, Rajnandgaon, Sakti, Sarangarh-Bilaigarh, Sukma, Surajpur, Surguja"),
  Goa: split("North Goa, South Goa"),
  Gujarat: split("Ahmedabad, Amreli, Anand, Aravalli, Banaskantha, Bharuch, Bhavnagar, Botad, Chhota Udaipur, Dahod, Dang, Devbhoomi Dwarka, Gandhinagar, Gir Somnath, Jamnagar, Junagadh, Kheda, Kutch, Mahisagar, Mehsana, Morbi, Narmada, Navsari, Panchmahal, Patan, Porbandar, Rajkot, Sabarkantha, Surat, Surendranagar, Tapi, Vadodara, Valsad"),
  Haryana: split("Ambala, Bhiwani, Charkhi Dadri, Faridabad, Fatehabad, Gurugram, Hisar, Jhajjar, Jind, Kaithal, Karnal, Kurukshetra, Mahendragarh, Nuh, Palwal, Panchkula, Panipat, Rewari, Rohtak, Sirsa, Sonipat, Yamunanagar"),
  "Himachal Pradesh": split("Bilaspur, Chamba, Hamirpur, Kangra, Kinnaur, Kullu, Lahaul and Spiti, Mandi, Shimla, Sirmaur, Solan, Una"),
  Jharkhand: split("Bokaro, Chatra, Deoghar, Dhanbad, Dumka, East Singhbhum, Garhwa, Giridih, Godda, Gumla, Hazaribagh, Jamtara, Khunti, Koderma, Latehar, Lohardaga, Pakur, Palamu, Ramgarh, Ranchi, Sahibganj, Seraikela Kharsawan, Simdega, West Singhbhum"),
  Karnataka: split("Bagalkot, Ballari, Belagavi, Bengaluru Rural, Bengaluru Urban, Bidar, Chamarajanagar, Chikkaballapur, Chikkamagaluru, Chitradurga, Dakshina Kannada, Davanagere, Dharwad, Gadag, Hassan, Haveri, Kalaburagi, Kodagu, Kolar, Koppal, Mandya, Mysuru, Raichur, Ramanagara, Shivamogga, Tumakuru, Udupi, Uttara Kannada, Vijayanagara, Vijayapura, Yadgir"),
  Kerala: split("Alappuzha, Ernakulam, Idukki, Kannur, Kasaragod, Kollam, Kottayam, Kozhikode, Malappuram, Palakkad, Pathanamthitta, Thiruvananthapuram, Thrissur, Wayanad"),
  "Madhya Pradesh": split("Agar Malwa, Alirajpur, Anuppur, Ashoknagar, Balaghat, Barwani, Betul, Bhind, Bhopal, Burhanpur, Chhatarpur, Chhindwara, Damoh, Datia, Dewas, Dhar, Dindori, Guna, Gwalior, Harda, Indore, Jabalpur, Jhabua, Katni, Khandwa, Khargone, Maihar, Mandla, Mandsaur, Morena, Narmadapuram, Narsinghpur, Neemuch, Niwari, Pandhurna, Panna, Raisen, Rajgarh, Ratlam, Rewa, Sagar, Satna, Sehore, Seoni, Shahdol, Shajapur, Sheopur, Shivpuri, Sidhi, Singrauli, Tikamgarh, Ujjain, Umaria, Vidisha"),
  Maharashtra: split("Ahmednagar, Akola, Amravati, Aurangabad, Beed, Bhandara, Buldhana, Chandrapur, Dhule, Gadchiroli, Gondia, Hingoli, Jalgaon, Jalna, Kolhapur, Latur, Mumbai City, Mumbai Suburban, Nagpur, Nanded, Nandurbar, Nashik, Osmanabad, Palghar, Parbhani, Pune, Raigad, Ratnagiri, Sangli, Satara, Sindhudurg, Solapur, Thane, Wardha, Washim, Yavatmal"),
  Manipur: split("Bishnupur, Chandel, Churachandpur, Imphal East, Imphal West, Jiribam, Kakching, Kamjong, Kangpokpi, Noney, Pherzawl, Senapati, Tamenglong, Tengnoupal, Thoubal, Ukhrul"),
  Meghalaya: split("East Garo Hills, East Jaintia Hills, East Khasi Hills, Eastern West Khasi Hills, North Garo Hills, Ri Bhoi, South Garo Hills, South West Garo Hills, South West Khasi Hills, West Garo Hills, West Jaintia Hills, West Khasi Hills"),
  Mizoram: split("Aizawl, Champhai, Hnahthial, Khawzawl, Kolasib, Lawngtlai, Lunglei, Mamit, Saiha, Saitual, Serchhip"),
  Nagaland: split("Chümoukedima, Dimapur, Kiphire, Kohima, Longleng, Mokokchung, Mon, Niuland, Noklak, Peren, Phek, Shamator, Tseminyu, Tuensang, Wokha, Zunheboto"),
  Odisha: split("Angul, Balangir, Balasore, Bargarh, Bhadrak, Boudh, Cuttack, Deogarh, Dhenkanal, Gajapati, Ganjam, Jagatsinghpur, Jajpur, Jharsuguda, Kalahandi, Kandhamal, Kendrapara, Kendujhar, Khordha, Koraput, Malkangiri, Mayurbhanj, Nabarangpur, Nayagarh, Nuapada, Puri, Rayagada, Sambalpur, Subarnapur, Sundargarh"),
  Punjab: split("Amritsar, Barnala, Bathinda, Faridkot, Fatehgarh Sahib, Fazilka, Ferozepur, Gurdaspur, Hoshiarpur, Jalandhar, Kapurthala, Ludhiana, Malerkotla, Mansa, Moga, Mohali, Muktsar, Pathankot, Patiala, Rupnagar, Sangrur, Shahid Bhagat Singh Nagar, Tarn Taran"),
  Rajasthan: split("Ajmer, Alwar, Anupgarh, Balotra, Banswara, Baran, Barmer, Beawar, Bharatpur, Bhilwara, Bikaner, Bundi, Chittorgarh, Churu, Dausa, Deeg, Dholpur, Didwana-Kuchaman, Dudu, Dungarpur, Gangapur City, Hanumangarh, Jaipur, Jaipur Rural, Jaisalmer, Jalore, Jhalawar, Jhunjhunu, Jodhpur, Jodhpur Rural, Karauli, Kekri, Khairthal-Tijara, Kota, Kotputli-Behror, Nagaur, Neem Ka Thana, Pali, Phalodi, Pratapgarh, Rajsamand, Salumbar, Sanchore, Sawai Madhopur, Shahpura, Sikar, Sirohi, Sri Ganganagar, Tonk, Udaipur"),
  Sikkim: split("Gangtok, Gyalshing, Mangan, Namchi, Pakyong, Soreng"),
  "Tamil Nadu": [...TN_DISTRICTS],
  Telangana: split("Adilabad, Bhadradri Kothagudem, Hanumakonda, Hyderabad, Jagtial, Jangaon, Jayashankar Bhupalpally, Jogulamba Gadwal, Kamareddy, Karimnagar, Khammam, Komaram Bheem Asifabad, Mahabubabad, Mahabubnagar, Mancherial, Medak, Medchal-Malkajgiri, Mulugu, Nagarkurnool, Nalgonda, Narayanpet, Nirmal, Nizamabad, Peddapalli, Rajanna Sircilla, Rangareddy, Sangareddy, Siddipet, Suryapet, Vikarabad, Wanaparthy, Warangal, Yadadri Bhuvanagiri"),
  Tripura: split("Dhalai, Gomati, Khowai, North Tripura, Sepahijala, South Tripura, Unakoti, West Tripura"),
  "Uttar Pradesh": split("Agra, Aligarh, Ambedkar Nagar, Amethi, Amroha, Auraiya, Ayodhya, Azamgarh, Baghpat, Bahraich, Ballia, Balrampur, Banda, Barabanki, Bareilly, Basti, Bhadohi, Bijnor, Budaun, Bulandshahr, Chandauli, Chitrakoot, Deoria, Etah, Etawah, Farrukhabad, Fatehpur, Firozabad, Gautam Buddha Nagar, Ghaziabad, Ghazipur, Gonda, Gorakhpur, Hamirpur, Hapur, Hardoi, Hathras, Jalaun, Jaunpur, Jhansi, Kannauj, Kanpur Dehat, Kanpur Nagar, Kasganj, Kaushambi, Kushinagar, Lakhimpur Kheri, Lalitpur, Lucknow, Maharajganj, Mahoba, Mainpuri, Mathura, Mau, Meerut, Mirzapur, Moradabad, Muzaffarnagar, Pilibhit, Pratapgarh, Prayagraj, Raebareli, Rampur, Saharanpur, Sambhal, Sant Kabir Nagar, Shahjahanpur, Shamli, Shravasti, Siddharthnagar, Sitapur, Sonbhadra, Sultanpur, Unnao, Varanasi"),
  Uttarakhand: split("Almora, Bageshwar, Chamoli, Champawat, Dehradun, Haridwar, Nainital, Pauri Garhwal, Pithoragarh, Rudraprayag, Tehri Garhwal, Udham Singh Nagar, Uttarkashi"),
  "West Bengal": split("Alipurduar, Bankura, Birbhum, Cooch Behar, Dakshin Dinajpur, Darjeeling, Hooghly, Howrah, Jalpaiguri, Jhargram, Kalimpong, Kolkata, Malda, Murshidabad, Nadia, North 24 Parganas, Paschim Bardhaman, Paschim Medinipur, Purba Bardhaman, Purba Medinipur, Purulia, South 24 Parganas, Uttar Dinajpur"),
  // Union territories
  "Andaman and Nicobar Islands": split("Nicobar, North and Middle Andaman, South Andaman"),
  Chandigarh: split("Chandigarh"),
  "Dadra and Nagar Haveli and Daman and Diu": split("Dadra and Nagar Haveli, Daman, Diu"),
  Delhi: split("Central Delhi, East Delhi, New Delhi, North Delhi, North East Delhi, North West Delhi, Shahdara, South Delhi, South East Delhi, South West Delhi, West Delhi"),
  "Jammu and Kashmir": split("Anantnag, Bandipora, Baramulla, Budgam, Doda, Ganderbal, Jammu, Kathua, Kishtwar, Kulgam, Kupwara, Poonch, Pulwama, Rajouri, Ramban, Reasi, Samba, Shopian, Srinagar, Udhampur"),
  Ladakh: split("Kargil, Leh"),
  Lakshadweep: split("Lakshadweep"),
  Puducherry: split("Karaikal, Mahe, Puducherry, Yanam"),
};

export const ALL_STATES = Object.keys(DISTRICTS_BY_STATE);

export type DistrictEntry = { name: string; state: string; /** Unique key: "Name, State". */ key: string };

/** Every supported district with its state, deduplicated by key. */
export const ALL_DISTRICTS: DistrictEntry[] = Object.entries(DISTRICTS_BY_STATE).flatMap(([state, names]) =>
  [...new Set(names)].map((name) => ({ name, state, key: `${name}, ${state}` })),
);

const byName = new Map<string, DistrictEntry[]>();
for (const d of ALL_DISTRICTS) byName.set(d.name, [...(byName.get(d.name) ?? []), d]);
/** Entries sharing a district name (e.g. Bilaspur in Chhattisgarh and Himachal Pradesh). */
export const districtsNamed = (name: string) => byName.get(name) ?? [];
