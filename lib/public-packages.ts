/** Public copy aligned with `public/nesta-packages.jpg` (套餐原图). */
export type PublicPackageId = 'a' | 'b' | 'c';

export type PublicPackage = {
  id: PublicPackageId;
  tag: [string, string];
  title: [string, string];
  totalCny: number;
  edition: [string, string];
  highlight: [string, string];
  summary: [string, string];
  points: Array<[string, string]>;
  featured?: boolean;
};

/** Main programme prices on the sheet are RMB only — never USD equivalents. */
export function formatPackageMainPrice(total: number, lang: 'zh' | 'en'): string {
  if (lang === 'zh') {
    if (total === 400_000) return '40万';
    if (total === 520_000) return '52万';
    if (total === 580_000) return '58万';
    if (total === 630_000) return '63万';
    return `¥${total.toLocaleString('zh-CN')}`;
  }
  return `RMB ${total.toLocaleString('en-US')}`;
}

/** @deprecated Use formatPackageMainPrice */
export const formatPackageTotalCny = formatPackageMainPrice;

export function formatPackageMainPriceCaption(lang: 'zh' | 'en'): string {
  return lang === 'zh'
    ? '人民币（套餐主价）'
    : 'Chinese yuan (RMB) — programme price on the sheet, not US dollars';
}

export const PUBLIC_PACKAGES: PublicPackage[] = [
  {
    id: 'a',
    tag: ['A / 自卵自精', 'A / Own eggs & sperm'],
    title: ['医疗协助', 'Medical assistance'],
    totalCny: 400_000,
    edition: ['常规版', 'Standard edition'],
    highlight: ['爱心供卵 +5,000美元', 'Donor-egg care add-on + USD 5,000'],
    summary: [
      '自卵自精，常规版 40 万。一次促排加三次移植，不含接娃期间住宿，不含 DNA 亲子鉴定。爱心供卵另加 5,000 美元。',
      'Own eggs and sperm, standard edition at RMB 400,000. One stimulation cycle plus three transfers. Accommodation during baby collection and DNA parentage testing are excluded. The donor-egg care add-on is an extra USD 5,000.',
    ],
    points: [
      ['一次促排 + 三次移植', 'One stimulation cycle + three transfers'],
      ['PGS 报告后两个月内安排移植', 'Transfer arranged within two months of the PGS report'],
      ['不含接娃期间住宿', 'Accommodation during baby collection excluded'],
      ['不含 DNA 亲子鉴定', 'DNA parentage testing excluded'],
    ],
  },
  {
    id: 'b',
    featured: true,
    tag: ['B / 自精供卵', 'B / Own sperm & donor eggs'],
    title: ['推荐无忧', 'Recommended care'],
    totalCny: 520_000,
    edition: ['自精供卵', 'Donor eggs, your sperm'],
    highlight: ['优选性别', 'Preferred sex selection'],
    summary: [
      '自精供卵，52 万。含 4 个 PGS，不限次数促排及移植，含 DNA 亲子鉴定、宝宝健康保障条款和接娃期间住宿。优选性别以书面合同为准，不保证医疗结果。',
      'Donor eggs and your sperm, RMB 520,000. Four PGS tests, unlimited stimulation and transfers, DNA parentage testing, baby health protection terms and accommodation during baby collection. Preferred sex selection follows the written contract and is not a guaranteed medical outcome.',
    ],
    points: [
      ['包含 4 个 PGS 检测', 'Includes four PGS tests'],
      ['不限次数促排及移植', 'Unlimited stimulation cycles and transfers'],
      ['PGS 报告后两个月内安排移植', 'Transfer arranged within two months of the PGS report'],
      ['含 DNA 亲子鉴定', 'Includes DNA parentage testing'],
      ['含宝宝健康保障条款', 'Includes baby health protection terms'],
      ['含接娃期间住宿', 'Includes accommodation during baby collection'],
    ],
  },
  {
    id: 'c',
    tag: ['C / 自精供卵', 'C / Own sperm & donor eggs'],
    title: ['成功优选', 'Success selection'],
    totalCny: 580_000,
    edition: ['常规版 · 63万升级大包版', 'Standard · RMB 630,000 upgraded package'],
    highlight: ['单胎男宝保障', 'Singleton boy protection'],
    summary: [
      '自精供卵。常规版 58 万，升级大包版 63 万。全部胚胎 PGS，不限次数促排及移植，PGS 报告后一个月内安排移植。升级版具体差异另行确认。含 DNA 亲子鉴定、宝宝健康保障条款和接娃期间住宿。单胎男宝保障以书面合同为准。',
      'Donor eggs and your sperm. Standard edition RMB 580,000; upgraded package RMB 630,000. PGS for all embryos, unlimited stimulation and transfers, with transfer arranged within one month of the PGS report. Upgrade differences are confirmed separately. DNA parentage testing, baby health protection terms and accommodation during baby collection are included. Singleton boy protection follows the written contract.',
    ],
    points: [
      ['全部胚胎 PGS 筛查', 'PGS screening for all embryos'],
      ['不限次数促排及移植', 'Unlimited stimulation cycles and transfers'],
      ['PGS 报告后一个月内安排移植', 'Transfer arranged within one month of the PGS report'],
      ['升级版具体差异另行书面确认', 'Upgrade differences confirmed in writing'],
      ['含 DNA 亲子鉴定', 'Includes DNA parentage testing'],
      ['含宝宝健康保障条款', 'Includes baby health protection terms'],
      ['含接娃期间住宿', 'Includes accommodation during baby collection'],
    ],
  },
];

export const PACKAGE_SHEET_VERSION = '2026-11';

export const PACKAGE_STRIP: Array<[string, string]> = [
  ['LeaderMed 医院独家合作伙伴', 'Exclusive partner of LeaderMed'],
  ['专业月子中心', 'Professional postpartum centre'],
  ['持牌儿科医生 24 小时值班', 'Licensed paediatricians on 24-hour duty'],
];

export const PACKAGE_INCLUSIONS: Array<{title: [string, string]; note?: [string, string]}> = [
  {title: ['接机服务', 'Airport pickup']},
  {title: ['办理当地手机卡', 'Local SIM card']},
  {title: ['全程30天住宿，可自由分配', '30 days of accommodation, allocated as you choose'], note: ['A方案不含接娃期间住宿', 'Programme A excludes accommodation while collecting the baby']},
  {title: ['全套文件公证、海牙认证及法务服务', 'Notarisation, Apostille and legal services']},
  {title: ['医疗陪诊及翻译服务', 'Medical accompaniment and interpreting']},
  {title: ['取卵及相关医疗费用', 'Egg retrieval and related medical fees']},
  {title: ['精子及胚胎储存1年', 'Sperm and embryo storage for 1 year']},
  {title: ['胚胎PGS筛查', 'Embryo PGS screening'], note: ['具体范围以合同为准', 'Scope follows the contract']},
  {title: ['移植服务', 'Transfer'], note: ['次数及安排按所选套餐', 'Number and timing follow the selected programme']},
  {title: ['代孕者补偿金、医疗费及营养费', 'Surrogate compensation, medical and nutrition fees']},
  {title: ['流产、子宫切除及死亡相关补偿', 'Compensation related to miscarriage, hysterectomy and death'], note: ['补偿对象、金额及触发条件以合同为准', 'Who is paid, how much, and when, follow the contract']},
  {title: ['新生儿分娩、体检及护理', 'Delivery, newborn examination and care']},
  {title: ['新生儿乙肝疫苗、卡介苗', 'Newborn hepatitis B vaccine and BCG']},
  {title: ['出生证及护照办理', 'Birth certificate and passport'], note: ['DNA亲子鉴定：B、C包含，A不包含', 'DNA parentage testing: included in B and C, not in A']},
];

export const PACKAGE_EXTRAS: Array<{title: [string, string]; price: [string, string]}> = [
  {title: ['双胎', 'Twins'], price: ['3,000美元', 'USD 3,000']},
  {title: ['剖腹产', 'Caesarean'], price: ['2,000美元', 'USD 2,000']},
  {title: ['额外PGS检查', 'Additional PGS'], price: ['500美元 / 颗', 'USD 500 each']},
  {title: ['NICU费用', 'NICU'], price: ['约300美元 / 天', 'About USD 300 / day']},
  {title: ['梅毒', 'Syphilis'], price: ['3,000美元', 'USD 3,000']},
  {title: ['HIV', 'HIV'], price: ['5,000美元', 'USD 5,000']},
  {title: ['自卵方案：二次促排 + 移植', 'Own-egg programme: second stimulation and transfer'], price: ['12,000美元', 'USD 12,000']},
  {title: ['其他特殊医疗及附加服务', 'Other specialised medical and add-on services'], price: ['另行咨询', 'Quoted separately']},
];

export const PACKAGE_EXPEDITE: {title: [string, string]; body: [string, string]} = {
  title: ['加速包 · 5,000美元', 'Expedited package · USD 5,000'],
  body: ['约定12个月内出生；未达约定退还加速包费用。起算时间、适用条件及退款规则以书面合同为准。', 'Birth within the agreed 12 months; if that is missed, the expedited fee is refunded. The start date, conditions and refund rules follow the written contract.'],
};

export const PACKAGE_DISCLAIMER: [string, string] = [
  '保障范围及履约条件以合同及医疗评估为准。医疗结果存在个体差异。报价依据所提供资料，套餐币种、有效期及费用边界以书面报价为准。次数、时间安排、补偿及证件办理以书面合同和医疗评估为准。项目开展须符合所在地法律与医疗要求。',
  'Protection and performance follow the contract and clinical assessment. Medical outcomes vary. Quotes follow the information you provide; currency, validity and fee boundaries follow the written quote. Counts, timing, compensation and documents follow the written contract and clinical assessment. A programme proceeds only where local law and clinical rules allow.',
];
