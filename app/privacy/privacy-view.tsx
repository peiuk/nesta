'use client';
import Link from "next/link";
import {PublicShell} from '@/components/product/public-shell';
import {useLocale} from '@/components/product/locale';

export function PrivacyView() {
  const {t} = useLocale();
  const sections: Array<[string, string]> = [
    [
      t('我们是谁', 'Who we are'),
      t(
        '本网站由奈斯（Nesta）运营，提供格鲁吉亚代孕相关协调与进度记录服务。我们不是医疗机构，也不是律师事务所。公开页面用于介绍服务、费用参考与咨询联系；客户档案与报告交付在经审核后通过私密客户空间进行。',
        'This site is operated by Nesta and describes Georgia surrogacy-related coordination and progress records. We are not a medical provider or a law firm. Public pages introduce services, fee references and contact options; profiles and report delivery take place in a private client space after review.',
      ),
    ],
    [
      t('我们收集什么', 'What we collect'),
      t(
        '当你通过电话或邮件咨询时，我们会处理你主动提供的联系方式与沟通内容。当你登录客户空间时，网站会保存登录标识或会话、邮箱以及可用的显示名称；你填写的称呼、语言、居住地区及服务意向会保存为服务档案。同一邮箱将合并为同一档案。',
        'When you contact us by phone or email, we process the contact details and messages you choose to share. When you sign in to the client space, the site stores a sign-in identifier or session, email and an available display name. Your name, language, jurisdiction and interests are saved as your service profile. The same email maps to one profile.',
      ),
    ],
    [
      t('我们如何使用资料', 'How we use information'),
      t(
        '资料用于回复咨询、协调服务流程、记录进度与授权范围内的报告交付。我们不会将客户档案用于与协调无关的营销列表。能否开展服务须个案评估；网站信息不构成医疗或法律意见。',
        'Information is used to respond to enquiries, coordinate the service process, record progress and deliver reports within granted access. Client profiles are not used for unrelated marketing lists. Whether a service proceeds requires individual assessment; site information is not medical or legal advice.',
      ),
    ],
    [
      t('保存与访问', 'Storage and access'),
      t(
        '档案及操作记录保存在网站的服务端数据库，附件保存在私密文件存储。获准且分配到案件的工作人员按职责处理资料，客户只可查看获准共享的已发布文件。',
        'Profiles and activity records are stored in the site database; attachments use private file storage. Approved, assigned staff access records for their duties, and clients see published files explicitly shared with them.',
      ),
    ],
    [
      t('你的权利', 'Your rights'),
      t(
        '你可以请求查阅、纠正或删除与你相关的服务档案与沟通记录，具体以适用法律及双方合同为准。请通过网站公布的电话或邮件联系我们。',
        'You may request access, correction or deletion of service records and communications relating to you, subject to applicable law and any signed agreement. Contact us using the phone number or email published on this site.',
      ),
    ],
    [
      t('服务边界', 'Service scope'),
      t(
        '奈斯的业务是格鲁吉亚代孕相关协调与进度记录，并协调独立精卵资料库的授权查阅。本站不提供医疗诊断、法律资格判断、紧急医疗联络或在线付款结算，也不承诺医疗结果。诊疗由接诊医疗机构负责；法律事务由持牌专业人士确认。',
        'Nesta provides Georgia surrogacy-related coordination and progress records, and coordinates authorised access to independent egg and sperm directories. This site does not provide diagnosis, legal eligibility decisions, emergency medical contact or online payment processing, and does not guarantee medical outcomes. Clinics handle clinical care; licensed professionals handle legal matters.',
      ),
    ],
    [
      t('公开价格说明', 'Public pricing'),
      t(
        '首页与费用页的三档主价为人民币，与套餐原图一致，不做美元换算；另计项按原图以美元标注。价格可能随合作诊所、汇率与方案调整。是否含税、发票与当地费用以书面报价和签约合同为准。网站标价不构成要约，最终应付金额以双方签署的合同及附件为准。',
        'The three programme prices on the homepage and fees page are in RMB (Chinese yuan), matching the package sheet and not converted to US dollars. Listed extras stay in USD where the sheet shows USD. Prices may change with partner clinics, FX and programme details. Tax, invoicing and local fees follow the written quote and signed contract. Site prices are not an offer; amounts due are governed by the signed contract and attachments.',
      ),
    ],
    [
      t('客户空间与试用说明', 'Client space and pilot use'),
      t(
        '客户空间用于建立档案、授权查阅与报告交付。当前版本可能处于产品试用阶段：请勿在未经团队确认的情况下上传真实医疗、遗传、身份或儿童信息。试用资料的导出、纠正与删除请求可通过公布的联系方式提出。',
        'The client space is for profiles, access grants and report delivery. The current release may still be in pilot use: do not upload real medical, genetic, identity or child information unless the team has confirmed you should. For export, correction or deletion of pilot records, contact us using the published channels.',
      ),
    ],
  ];

  return (
    <PublicShell current="/privacy">
      <main className="faq-main">
        <nav className="public-crumbs" aria-label={t('面包屑', 'Breadcrumb')}>
          <ol>
            <li>
              <Link href="/">{t('首页', 'Home')}</Link>
            </li>
            <li aria-current="page">{t('隐私政策', 'Privacy policy')}</li>
          </ol>
        </nav>
        <h1>{t('隐私政策', 'Privacy policy')}</h1>
        <p className="faq-lead">
          {t(
            '说明我们如何处理公开咨询与客户空间中的个人资料。你的合同、书面报价和医疗机构的判断仍然优先。',
            'How we handle personal information for public enquiries and the client space. Your contract, written quote and the clinic’s judgement still come first.',
          )}
        </p>
        {sections.map(([title, body]) => (
          <section key={title} className="privacy-section">
            <h2>{title}</h2>
            <p>{body}</p>
          </section>
        ))}
        <div className="faq-next">
          <Link className="primary-link" href="/#contact">
            {t('联系咨询', 'Contact us')}
          </Link>
          <Link className="hero-process-link" href="/portal">
            {t('进入客户空间', 'Client sign-in')}
          </Link>
        </div>
      </main>
    </PublicShell>
  );
}
