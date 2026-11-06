'use client';
import Link from "next/link";
import {PublicShell} from '@/components/product/public-shell';
import {useLocale} from '@/components/product/locale';

export function PrivacyView() {
  const {t} = useLocale();
  const sections: Array<[string, string, string]> = [
    [
      'who-we-are',
      t('我们是谁', 'Who we are'),
      t(
        '本网站由奈斯（Nesta）运营，提供格鲁吉亚代孕相关协调与进度记录服务。我们不是医疗机构，也不是律师事务所。公开页面用于介绍服务、费用参考与咨询联系；客户档案与报告交付在经审核后通过私密客户空间进行。',
        'This site is operated by Nesta and describes Georgia surrogacy-related coordination and progress records. We are not a medical provider or a law firm. Public pages introduce services, fee references and contact options; profiles and report delivery take place in a private client space after review.',
      ),
    ],
    [
      'information-we-collect',
      t('我们收集什么', 'What we collect'),
      t(
        '当你通过电话或邮件咨询时，我们会处理你主动提供的联系方式与沟通内容。当你登录客户空间时，网站会保存登录标识或会话、邮箱以及可用的显示名称；你填写的称呼、语言、居住地区及服务意向会保存为服务档案。同一邮箱将合并为同一档案。',
        'When you contact us by phone or email, we process the contact details and messages you choose to share. When you sign in to the client space, the site stores a sign-in identifier or session, email and an available display name. Your name, language, jurisdiction and interests are saved as your service profile. The same email maps to one profile.',
      ),
    ],
    [
      'how-we-use-information',
      t('我们如何使用资料', 'How we use information'),
      t(
        '资料用于回复咨询、协调服务流程、记录进度与授权范围内的报告交付。我们不会将客户档案用于与协调无关的营销列表。能否开展服务须个案评估；网站信息不构成医疗或法律意见。',
        'Information is used to respond to enquiries, coordinate the service process, record progress and deliver reports within granted access. Client profiles are not used for unrelated marketing lists. Whether a service proceeds requires individual assessment; site information is not medical or legal advice.',
      ),
    ],
    [
      'storage-and-access',
      t('保存与访问', 'Storage and access'),
      t(
        '档案及操作记录保存在网站的服务端数据库，附件保存在私密文件存储。获准且分配到案件的工作人员按职责处理资料，客户只可查看获准共享的已发布文件。',
        'Profiles and activity records are stored in the site database; attachments use private file storage. Approved, assigned staff access records for their duties, and clients see published files explicitly shared with them.',
      ),
    ],
    [
      'email-notifications',
      t('更新邮件通知', 'Update email notifications'),
      t(
        '当报告与文件、服务进度或沟通记录有面向客户的更新时，系统会尝试向相关客户档案中的邮箱发送提醒，并提供客户空间入口。报告通知仅发送给获准接收该报告的客户；沟通记录通知发送给与该记录关联的客户；服务进度通知发送给该案件的客户。提醒邮件不包含私密记录或文件附件，最新内容请登录客户空间查看。',
        'When reports and files, service progress or communication records receive a client-visible update, the system attempts to send a notice to the relevant client profile email with a link to the client space. Report notices go only to clients authorised to receive that report; communication notices go to the client associated with that record; progress notices go to clients on the case. Notice emails do not contain private records or file attachments. Sign in to the client space to view the latest content.',
      ),
    ],
    [
      'google-gmail-data',
      t('Google 账号与 Gmail API 数据', 'Google account and Gmail API data'),
      t(
        '为发送客户空间登录验证码、服务更新提醒及相关服务邮件，奈斯会使用经授权的发件 Google 账号调用 Gmail API。授权范围仅为 gmail.send，即代表该账号发送邮件。应用不会读取该 Gmail 账号的收件箱、草稿、联系人或邮件附件，也不会出售 Gmail 数据、将其用于广告或用户画像，或用于训练、改进人工智能或机器学习模型。发送时会将发件地址、收件地址、主题和邮件正文交给 Google 处理并投递；正文可能包含一次性登录验证码，或更新类别与客户空间链接。通知邮件不包含报告内容或文件附件。邮件由收件人的邮件服务接收；如服务器配置了其他发信服务，该服务也会处理发送所需的邮件字段。',
        'To send client-space sign-in codes, service update notices and related service emails, Nesta uses the authorised sender Google account with the Gmail API. The app requests only the gmail.send scope, which allows it to send email on that account’s behalf. It does not read that Gmail account’s inbox, drafts, contacts or attachments. Gmail data is not sold, used for advertising or profiling, or used to train or improve AI or machine-learning models. To send a message, the sender address, recipient address, subject and message body are provided to Google for processing and delivery. A body may contain a one-time sign-in code, or an update category and client-space link. Notice emails do not include report contents or file attachments. The recipient’s email provider receives the message; if another mail provider is configured on the server, that provider also processes the fields needed to send it.',
      ),
    ],
    [
      'google-data-storage',
      t('Google 授权信息的保存与撤销', 'Storage and revocation of Google authorisation'),
      t(
        'OAuth 客户端密钥和刷新令牌保存在服务端部署密钥配置中，不发送到浏览器。应用在发信时向 Google 换取短期访问令牌，用于当前发送请求；应用不会将该访问令牌持久化保存。为重试投递，客户更新通知的收件地址、主题、正文和发送状态会写入服务端通知队列；当前系统不会自动清理已发送的队列记录，暂无固定删除期限。你可通过 Google 账号的第三方应用连接设置撤销授权，也可通过本站联系方式请求删除相关服务记录；撤销授权后，系统将无法继续通过该 Gmail 账号发送邮件。',
        'The OAuth client secret and refresh token are stored in server-side deployment secret settings and are not sent to the browser. When sending email, the app obtains a short-lived access token from Google for that request; it does not persistently store that access token. To retry delivery, recipient addresses, subjects, bodies and delivery status for client update notices are stored in the server-side notification queue. The current system does not automatically delete sent queue records and has no fixed deletion period for them. You can revoke access in your Google Account’s third-party connections settings, or request deletion of related service records through the contact details on this site. After revocation, the system cannot continue sending through that Gmail account.',
      ),
    ],
    [
      'your-rights',
      t('你的权利', 'Your rights'),
      t(
        '你可以请求查阅、纠正或删除与你相关的服务档案与沟通记录，具体以适用法律及双方合同为准。请通过网站公布的电话或邮件联系我们。',
        'You may request access, correction or deletion of service records and communications relating to you, subject to applicable law and any signed agreement. Contact us using the phone number or email published on this site.',
      ),
    ],
    [
      'service-scope',
      t('服务边界', 'Service scope'),
      t(
        '奈斯的业务是格鲁吉亚代孕相关协调与进度记录，并协调独立精卵资料库的授权查阅。本站不提供医疗诊断、法律资格判断、紧急医疗联络或在线付款结算，也不承诺医疗结果。诊疗由接诊医疗机构负责；法律事务由持牌专业人士确认。',
        'Nesta provides Georgia surrogacy-related coordination and progress records, and coordinates authorised access to independent egg and sperm directories. This site does not provide diagnosis, legal eligibility decisions, emergency medical contact or online payment processing, and does not guarantee medical outcomes. Clinics handle clinical care; licensed professionals handle legal matters.',
      ),
    ],
    [
      'public-pricing',
      t('公开价格说明', 'Public pricing'),
      t(
        '首页与费用页的三档主价为人民币，与套餐原图一致，不做美元换算；另计项按原图以美元标注。价格可能随合作诊所、汇率与方案调整。是否含税、发票与当地费用以书面报价和签约合同为准。网站标价不构成要约，最终应付金额以双方签署的合同及附件为准。',
        'The three programme prices on the homepage and fees page are in RMB (Chinese yuan), matching the package sheet and not converted to US dollars. Listed extras stay in USD where the sheet shows USD. Prices may change with partner clinics, FX and programme details. Tax, invoicing and local fees follow the written quote and signed contract. Site prices are not an offer; amounts due are governed by the signed contract and attachments.',
      ),
    ],
    [
      'client-space-pilot',
      t('客户空间与试用说明', 'Client space and pilot use'),
      t(
        '客户空间用于建立档案、授权查阅与报告交付。当前版本可能处于产品试用阶段：请勿在未经团队确认的情况下上传真实医疗、遗传、身份或儿童信息。试用资料的导出、纠正与删除请求可通过公布的联系方式提出。',
        'The client space is for profiles, access grants and report delivery. The current release may still be in pilot use: do not upload real medical, genetic, identity or child information unless the team has confirmed you should. For export, correction or deletion of pilot records, contact us using the published channels.',
      ),
    ],
  ];

  return (
    <PublicShell current="/privacy">
      <main className="faq-main privacy-main">
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
        <nav className="privacy-contents" aria-label={t('本页目录', 'On this page')}>
          <p>{t('本页内容', 'On this page')}</p>
          <ol>
            {sections.map(([id, title]) => (
              <li key={id}><a href={`#${id}`}>{title}</a></li>
            ))}
          </ol>
        </nav>
        {sections.map(([id, title, body]) => (
          <section id={id} key={id} className="privacy-section">
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
