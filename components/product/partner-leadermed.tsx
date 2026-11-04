'use client';
/* oxlint-disable next/no-img-element -- Static marketing files in public/, same pattern as the homepage hero. */
import {ArrowUpRight,Mail,MapPin,Phone} from 'lucide-react';
import {useLocale} from '@/components/product/locale';

const CLINIC_SITE='https://www.leadermed.net/';
const TEMOS_POST='https://www.leadermed.net/post/temos-international-healthcare-accreditation-tiha';
const TEMOS_DIRECTORY='https://temos-accreditation.com/AccreditedPartners/Details.aspx?id=27022';
const ISO_POST='https://www.leadermed.net/post/leadermed-clinic-achieved-iso-9001-2015-certification';
const PHONE_TEL='+995322157777';
const PHONE_LABEL='+995 32 2 157 777';
const EMAIL='info@leadermed.ge';
const MAPS='https://www.google.com/maps?q=41.7804391,44.7724438';
const INSTAGRAM='https://www.instagram.com/leadermed_clinic/';

export function PartnerLeaderMed({compact=false}:{compact?:boolean}){
 const {t}=useLocale();
 const doctors=[
  {name:'Maia Koiava',role:t('首席胚胎学家','Chief Embryologist'),note:'',src:'/partners/leadermed/maia-koiava.jpg',w:900,h:1200},
  {name:'Ketevan Kantaria',role:t('产科-妇科医生、生殖医学','Obstetrician-gynaecologist, Reproductologist'),note:'',src:'/partners/leadermed/ketevan-kantaria.jpg',w:900,h:1200},
  {name:'Giorgi Dolidze',role:t('产科-妇科医生、腹腔镜外科','Obstetrician-gynecologist, laparoscopic surgeon'),note:'',src:'/partners/leadermed/giorgi-dolidze.jpg',w:670,h:754},
  {name:'Laliko Kharabadze',role:t('临床胚胎学家','Clinical Embryologist'),note:t('医学学士；遗传学硕士，博士在读','BSc Medicine; MSc Genetics, PhD Fellow'),src:'/partners/leadermed/laliko-kharabadze.jpg',w:900,h:1200},
 ];
 const photos=[
  {src:'/partners/leadermed/aerial.jpg',w:824,h:828,label:t('航拍外观','Aerial exterior')},
  {src:'/partners/leadermed/entrance.jpg',w:1600,h:1068,label:t('入口标识','Entrance sign')},
  {src:'/partners/leadermed/lobby.jpg',w:1600,h:1066,label:t('大堂','Lobby')},
  {src:'/partners/leadermed/lab-1.jpg',w:1600,h:1080,label:t('实验室','Laboratory')},
  {src:'/partners/leadermed/lab-2.jpg',w:1600,h:1066,label:t('实验室','Laboratory')},
  {src:'/partners/leadermed/conference.jpg',w:1600,h:1066,label:t('会议室','Conference room')},
 ];
 const timeline=[
  ['1998',t('诊所介绍：前身 In Vitro Clinic 奠基。','Clinic account: the earlier In Vitro Clinic was founded.')],
  ['2000',t('诊所介绍称，团队在格鲁吉亚完成首例 IVF 婴儿。此为对方表述，不是奈斯对这一说法的背书。','The clinic says its team delivered Georgia’s first IVF baby. That is the clinic’s account, not a Nesta endorsement.')],
  ['2005',t('诊所介绍称开始卵子捐赠、代孕相关医疗，以及卵子与精子冷冻。','The clinic says it began egg donation, surrogacy-related care, and egg and sperm freezing.')],
  ['2010',t('成为国立医科大学附属诊所。','Became an affiliated clinic of the State Medical University.')],
  ['2021',t('扩建为多学科 LeaderMed，涵盖 IVF、门诊、手术与产科。','Expanded into multidisciplinary LeaderMed: IVF, outpatient care, surgery and obstetrics.')],
 ];
 const others=[
  ['Ketevan Kakashvili',t('产科-妇科医生、生殖医学','Obstetrician-gynaecologist, Reproductologist')],
  ['Juna Zimlitski',t('产科-妇科医生、生殖医学','Obstetrician-gynaecologist, Reproductologist')],
  ['Natia Kipiani',t('产科-妇科医生、生殖医学','Obstetrician-gynaecologist, Reproductologist')],
  ['Luda Barbakadze',t('产科-妇科医生、生殖医学','Obstetrician-gynaecologist, Reproductologist')],
  ['Lili Gvaramadze',t('产科-妇科医生、生殖医学','Obstetrician-gynaecologist, Reproductologist')],
  ['Zura Vashakidze',t('生殖医学、产科-妇科医生','Reproductologist, Obstetrician-Gynecologist')],
 ];
 if(compact){
  return <section id="partner-leadermed" className="partner-section partner-section-compact" aria-labelledby="partner-leadermed-title">
   <div className="section-intro">
    <div>
     <div className="eyebrow">OFFICIAL PARTNER</div>
     <h2 id="partner-leadermed-title">{t('LeaderMed 医院独家合作伙伴。','Exclusive partner of LeaderMed hospital.')}</h2>
    </div>
   </div>
   <p className="partner-lead">{t('奈斯是第比利斯 LeaderMed 医院的独家合作伙伴，协调评估与治疗安排。配套月子中心为专业机构，持牌儿科医生实行 24 小时值班。诊疗由医疗机构负责。','Nesta is the exclusive partner of LeaderMed hospital in Tbilisi, and coordinates assessment and treatment arrangements. The accompanying postpartum centre is a professional facility, with licensed paediatricians on 24-hour duty. Clinical care stays with the medical provider.')}</p>
   <div className="partner-layout partner-layout-compact">
    <figure className="partner-hero">
     <img src="/partners/leadermed/street.jpg" width={1600} height={844} alt={t('LeaderMed 沿街外观','Street exterior of LeaderMed')}/>
     <figcaption>{t('沿街外观 · 取自诊所公开页面','Street exterior · from the clinic’s public site')}</figcaption>
    </figure>
    <div className="partner-facts">
     <img className="partner-wordmark" src="/partners/leadermed/wordmark.png" width={3162} height={1004} alt="LeaderMed"/>
     <h3>LeaderMed</h3>
     <p className="partner-intro">{t('第比利斯 Nodar Bokhua 街 21 号。奈斯协调评估与治疗安排；诊疗由 LeaderMed 负责。','21 Nodar Bokhua St., Tbilisi. Nesta coordinates assessment and treatment arrangements; clinical care stays with LeaderMed.')}</p>
     <ul className="partner-contacts">
      <li><MapPin size={16} strokeWidth={1.6} aria-hidden="true"/><a href={MAPS} target="_blank" rel="noreferrer">{t('第比利斯 Nodar Bokhua 街 21 号','21 Nodar Bokhua St., Tbilisi')}</a></li>
      <li><Phone size={16} strokeWidth={1.6} aria-hidden="true"/><a href={`tel:${PHONE_TEL}`}>{PHONE_LABEL}</a></li>
     </ul>
    </div>
   </div>
   <p className="partner-boundary">{t('奈斯是代孕协调方，负责沟通、行程与进度记录。LeaderMed 是合作医疗机构，诊疗、医学判断与临床结果由其负责。','Nesta is the surrogacy coordinator, responsible for communication, travel and progress records. LeaderMed is the partner medical provider and remains responsible for clinical care, medical judgement and clinical outcomes.')}</p>
   <a className="network-more partner-clinic-link" href="/clinic">{t('查看合作医院完整介绍','Full partner clinic page')}<ArrowUpRight size={14}/></a>
  </section>;
 }
 return <section id="partner-leadermed" className="partner-section" aria-labelledby="partner-leadermed-title">
  <div className="section-intro">
   <div>
    <div className="eyebrow">OFFICIAL PARTNER</div>
    <h2 id="partner-leadermed-title">{t('LeaderMed 医院独家合作伙伴。','Exclusive partner of LeaderMed hospital.')}</h2>
   </div>
  </div>
  <p className="partner-lead">{t('奈斯是第比利斯 LeaderMed 医院的独家合作伙伴，协调评估与治疗安排。配套月子中心为专业机构，持牌儿科医生实行 24 小时值班。诊疗由医疗机构负责。','Nesta is the exclusive partner of LeaderMed hospital in Tbilisi, and coordinates assessment and treatment arrangements. The accompanying postpartum centre is a professional facility, with licensed paediatricians on 24-hour duty. Clinical care stays with the medical provider.')}</p>
  <div className="partner-layout">
   <figure className="partner-hero">
    <img src="/partners/leadermed/street.jpg" width={1600} height={844} alt={t('LeaderMed 沿街外观','Street exterior of LeaderMed')}/>
    <figcaption>{t('沿街外观 · 取自诊所公开页面','Street exterior · from the clinic’s public site')}</figcaption>
   </figure>
   <div className="partner-facts">
    <img className="partner-wordmark" src="/partners/leadermed/wordmark.png" width={3162} height={1004} alt="LeaderMed"/>
    <h3>LeaderMed</h3>
    <p className="partner-intro">{t('法律名称「In Vitro Fertilization Center」LLC（Leadermed），识别号 202462708，地址为第比利斯 Nodar Bokhua 街 21 号。诊所介绍其前身为 In Vitro 诊所，2021 年起以 LeaderMed 之名运营。奈斯在此协调评估与治疗安排，不替代诊所的医学判断。','Legal name “In Vitro Fertilization Center” LLC (Leadermed), ID 202462708, at 21 Nodar Bokhua St., Tbilisi. The clinic describes itself as the successor of In Vitro Clinic and, since 2021, as LeaderMed. Nesta coordinates assessment and treatment arrangements here and does not replace the clinic’s medical judgement.')}</p>
    <ul className="partner-contacts">
     <li><MapPin size={16} strokeWidth={1.6} aria-hidden="true"/><a href={MAPS} target="_blank" rel="noreferrer">{t('第比利斯 Nodar Bokhua 街 21 号','21 Nodar Bokhua St., Tbilisi')}</a></li>
     <li><Phone size={16} strokeWidth={1.6} aria-hidden="true"/><a href={`tel:${PHONE_TEL}`}>{PHONE_LABEL}</a></li>
     <li><Mail size={16} strokeWidth={1.6} aria-hidden="true"/><a href={`mailto:${EMAIL}`}>{EMAIL}</a></li>
     <li><ArrowUpRight size={16} strokeWidth={1.6} aria-hidden="true"/><a href={CLINIC_SITE} target="_blank" rel="noreferrer">leadermed.net</a></li>
     <li><ArrowUpRight size={16} strokeWidth={1.6} aria-hidden="true"/><a href={INSTAGRAM} target="_blank" rel="noreferrer">@leadermed_clinic</a></li>
    </ul>
    <p className="partner-id">“In Vitro Fertilization Center” LLC (Leadermed) · ID 202462708</p>
    <div className="partner-services" aria-label={t('与协调相关的医疗环节','Clinical services relevant to coordination')}>
     {['IVF / ICSI',t('供卵','Egg donation'),t('胚胎遗传学检测 PGT-A / SR / M','Embryo genetic testing PGT-A / SR / M'),t('代孕相关医疗环节','Surrogacy-related clinical care')].map(label=> <span key={label}>{label}</span>)}
    </div>
   </div>
  </div>
  <ol className="partner-timeline">
   {timeline.map(([year,copy])=> <li key={year}><strong>{year}</strong><p>{copy}</p></li>)}
  </ol>
  <h3 className="partner-block-title">{t('公布的证书','Certificates on record')}</h3>
  <div className="partner-certs">
   <article className="partner-cert">
    <img src="/partners/leadermed/iso-9001.jpg" width={1200} height={1698} alt={t('ISO 9001:2015 证书扫描件，抬头 IN VITRO CLINIC，2022 年 6 月 15 日签发','ISO 9001:2015 certificate scan issued to IN VITRO CLINIC on 15 June 2022')}/>
    <div>
     <h3>ISO 9001:2015</h3>
     <p>{t('诊所公布过 ISO 9001:2015 证书：LMS 编号 GL96585A，抬头为 IN VITRO CLINIC，签发日 2022 年 6 月 15 日，监督审核期限为 2023 年 6 月 14 日之前。日期写在扫描件上。奈斯不据此表示该认证目前仍然有效。','The clinic has published an ISO 9001:2015 certificate: LMS No. GL96585A, issued to IN VITRO CLINIC on 15 June 2022, with surveillance due by 14 June 2023. The date is on the scan. Nesta does not treat this as proof the certification is still current.')}</p>
     <div className="partner-cert-links">
      <a href={ISO_POST} target="_blank" rel="noreferrer">{t('诊所说明','Clinic note')}<ArrowUpRight size={14}/></a>
     </div>
    </div>
   </article>
   <article className="partner-cert">
    <img src="/partners/leadermed/temos-tiha.jpg" width={1200} height={1696} alt={t('Temos 证书扫描件，编号 GE0136DEC2024，图形所载有效期至 2025 年 11 月','Temos certificate scan No. GE0136DEC2024; the graphic states validity through November 2025')}/>
    <div>
     <h3>Temos · TIHA</h3>
     <p>{t('诊所公布过 Temos 证书，编号 GE0136DEC2024；证书图形所载有效期至 2025 年 11 月，该日期现已过去。本页只展示这份材料和名录链接，不表示认证目前仍然有效。名录登记名可能为 In Vitro Fertilization Center。','The clinic has published a Temos certificate, No. GE0136DEC2024. The graphic states validity through November 2025, and that date has passed. This page shows that document and the directory link; it does not assert that accreditation is current. The listing name may be In Vitro Fertilization Center.')}</p>
     <div className="partner-cert-links">
      <a href={TEMOS_POST} target="_blank" rel="noreferrer">{t('诊所博文','Clinic post')}<ArrowUpRight size={14}/></a>
      <a href={TEMOS_DIRECTORY} target="_blank" rel="noreferrer">{t('Temos 名录','Temos directory')}<ArrowUpRight size={14}/></a>
     </div>
    </div>
   </article>
  </div>
  <h3 className="partner-block-title">{t('与协调相关的医生','Clinicians involved in coordination')}</h3>
  <div className="partner-doctors">
   {doctors.map(doc=> <article key={doc.name}>
    <img src={doc.src} width={doc.w} height={doc.h} alt={t(`${doc.name}，LeaderMed ${doc.role}`,`${doc.name}, LeaderMed ${doc.role}`)}/>
    <div><h3>{doc.name}</h3><p>{doc.role}</p>{doc.note?<p className="partner-doc-note">{doc.note}</p>:null}</div>
   </article>)}
  </div>
  <p className="partner-note">{t('职称按诊所 IVF 与妇科页面所列。以下为页面上的其他医生，不在首页展开证件照。','Roles follow the clinic’s IVF and gynaecology pages. Other clinicians listed there are below, without portraits on this page.')}</p>
  <details className="partner-more">
   <summary>{t('更多团队','More of the team')}</summary>
   <ul>{others.map(([name,role])=> <li key={name}><strong>{name}</strong> · {role}</li>)}</ul>
  </details>
  <h3 className="partner-block-title">{t('环境','The clinic')}</h3>
  <div className="partner-gallery">
   {photos.map(photo=> <figure key={photo.src}>
    <img src={photo.src} width={photo.w} height={photo.h} alt={t(`LeaderMed ${photo.label}`,`LeaderMed ${photo.label}`)}/>
    <figcaption>{photo.label}</figcaption>
   </figure>)}
  </div>
  <p className="partner-note">{t('环境照片取自诊所公开页面，用于了解场所，不是就诊者影像。','Facility photos are from the clinic’s public pages, to show the setting. They are not images of patients.')}</p>
  <p className="partner-note">{t('诊所位于第比利斯 Nodar Bokhua 街。国际家庭的行程与陪诊对接由奈斯协调；到院方式按行前安排确定。','The clinic is on Nodar Bokhua Street in Tbilisi. Nesta coordinates travel and accompaniment for international families; how you arrive is set in the pre-travel plan.')}</p>
  <p className="partner-boundary">{t('奈斯是代孕协调方，负责沟通、行程与进度记录。LeaderMed 是合作医疗机构，诊疗、医学判断与临床结果由其负责。','Nesta is the surrogacy coordinator, responsible for communication, travel and progress records. LeaderMed is the partner medical provider and remains responsible for clinical care, medical judgement and clinical outcomes.')}</p>
 </section>;
}
