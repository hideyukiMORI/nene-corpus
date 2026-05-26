export default {
  'meta.title': '安装指南 — NeNe Corpus HOWTO',
  'meta.description': '跟随咖啡馆老板 Sakura，4 步完成 NeNe Corpus 的安装与配置，从安装到 AI 聊天上线。',

  'nav.backToGuide': '返回指南',

  'persona.name': 'Sakura',
  'persona.role': '咖啡馆老板',
  'persona.shopName': 'Sakura 咖啡馆',
  'persona.avatar': 'S',

  'hero.badge': '安装指南 · 约 15 分钟',
  'hero.title': '跟 Persona 一起\n配置 NeNe Corpus',
  'hero.subtitle': '跟随咖啡馆老板 Sakura，4 个简单步骤为你的网站添加 AI 聊天功能。',
  'hero.persona.intro': '大家好！我是 Sakura，经营着 Sakura 咖啡馆。我想在网站上添加 AI 聊天功能，让访客随时都能提问。我们一起来完成吧！',
  'hero.cta': '开始配置',

  'steps.title': '4 步完成',
  'steps.subtitle': '跟随 Sakura 从安装到发布小部件，全程陪伴。',

  'step1.title': '安装',
  'step1.persona.speech': '首先只需将文件上传到服务器。听起来很技术，但用 FTP 就能搞定——不需要写代码！😊',
  'step1.item1': '从 GitHub Releases 下载最新版 ZIP',
  'step1.item2': '解压 ZIP，将内容上传到 `public_html`',
  'step1.item3': '在浏览器中打开 `https://你的域名/install`',
  'step1.item4': '输入数据库信息，点击「运行安装」',

  'step2.title': '配置 API 密钥',
  'step2.persona.speech': '创建 Anthropic 账号并获取 API 密钥。设置好之后 AI 就能运行了！✨',
  'step2.item1': '在 Anthropic (console.anthropic.com) 创建账号',
  'step2.item2': '生成新的 API 密钥并复制',
  'step2.item3': '打开管理后台 → 设置 → LLM 选项卡',
  'step2.item4': '粘贴密钥，点击「测试连接」→「保存」',

  'step3.title': '上传内容',
  'step3.persona.speech': '只需上传菜单 PDF 或 FAQ 文件，这就成了 AI 的知识库！📄',
  'step3.item1': '在管理后台点击「添加内容」',
  'step3.item2': '选择 PDF、CSV 或文本文件并上传',
  'step3.item3': '等待状态显示「完成」（几秒到几分钟）',
  'step3.item4': '菜单、FAQ、门店信息——可以上传任意多个文件',

  'step4.title': '嵌入小部件',
  'step4.persona.speech': '只需复制一行代码粘贴到网站！聊天功能就上线了。🎉',
  'step4.item1': '打开管理后台 → 设置 → 设计选项卡',
  'step4.item2': '复制「嵌入代码」部分的代码',
  'step4.item3': '粘贴到网站 HTML 的 `</body>` 标签之前',
  'step4.item4': '刷新页面——右下角出现聊天图标即表示完成！',

  'demo.title': '效果展示',
  'demo.subtitle': 'Sakura 咖啡馆访客的实际体验。问题即时得到附带引用的回答。',

  'demo.1.question': '抹茶拿铁多少钱？',
  'demo.1.answer': '抹茶拿铁含税售价 38 元。',
  'demo.1.citation': '菜单 p.2',

  'demo.2.question': '可以预订露台座位吗？',
  'demo.2.answer': '露台座位最多可供 4 人预订，可通过电话或网络表单预约。',
  'demo.2.citation': '门店信息 p.1',

  'demo.3.question': '有免费 Wi-Fi 吗？',
  'demo.3.answer': '有的！提供免费 Wi-Fi，到店后请询问工作人员获取密码。',
  'demo.3.citation': 'FAQ p.3',

  'cta.title': '在你的网站上部署',
  'cta.subtitle': '与 Sakura 相同的步骤。免费开源。',
  'cta.button': '立即开始',

  'footer.github': 'GitHub',
  'footer.license': 'MIT 许可证',
  'footer.backToTop': '返回顶部',
};
