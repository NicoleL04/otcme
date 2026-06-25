/* eslint-disable @typescript-eslint/no-explicit-any */
// User-facing copy. English source + Simplified Chinese.
// Medical terms use natural Chinese phrasing.

const en = {
  // Common
  back: "Back",
  back_to_dashboard: "Back to dashboard",
  continue: "Continue",
  send: "Send",
  save: "Save",
  cancel: "Cancel",
  loading: "Loading…",
  none: "None",
  optional: "Optional",
  language: "Language",

  // TopNav
  nav_switch_profile: "Switch profile",
  nav_settings: "Settings",
  nav_add_profile: "Add new profile",

  // Dashboard / Home
  home_active_profile: "Active profile",
  home_no_conditions: "No chronic conditions",
  home_rx: "Rx",
  home_allergies: "Allergies",
  home_home_meds: "Home",
  home_how_help: "How can we help today?",
  home_symptom_title: "I have a symptom — what should I get?",
  home_symptom_desc: "Tell us what's going on and we'll suggest safer OTC options.",
  home_safety_title: "Is this medicine safe for me?",
  home_safety_desc: "Snap a photo of the box or type the name to check fit with your profile.",
  home_wishlist_title: "My wishlist",
  home_wishlist_desc: "Medications you've saved from nearby pharmacies.",
  home_recent: "Recent activity",
  home_no_history:
    "No past consultations yet. Your symptom checks and safety lookups will appear here for {name}.",
  home_have_at_home: "Medicines you have at home:",
  home_at_home: "At home:",
  home_disclaimer:
    "OTC&Me provides informational guidance only and is not a substitute for advice from your pharmacist or physician.",
  home_symptom_check: "Symptom check",
  home_safety_check: "Safety check",

  // Onboarding
  onb_step_of: "Step {n} of 4",
  onb_who_title: "Who are you tracking for?",
  onb_who_desc: "We'll personalize OTC guidance for this person.",
  onb_self: "Myself",
  onb_self_taken: "You already have a personal profile. Edit it in Settings.",
  onb_self_desc: "Personal profile for your own use.",
  onb_loved: "A loved one",
  onb_loved_desc: "Track for a parent, child, or partner.",
  onb_their_name: "Their name",
  onb_name_placeholder: "e.g. Mom, Jake",

  onb_basic_title: "Basic info",
  onb_basic_desc: "Helps tailor dosing guidance.",
  onb_age: "Age",
  onb_gender: "Gender",
  onb_weight: "Weight",
  onb_height: "Height",
  onb_weight_ph: "e.g. 150 lbs",
  onb_height_ph: `e.g. 5'7"`,

  onb_health_title: "Health background",
  onb_health_desc: "Select all that apply. Free-text fields are optional.",
  onb_chronic: "Chronic conditions",
  onb_other: "Other",
  onb_other_ph: "Describe other condition",
  onb_rx: "Prescription medications",
  onb_rx_ph: "e.g. lisinopril 10mg daily",
  onb_allergies: "Known allergies",
  onb_allergies_ph: "e.g. penicillin, sulfa, NSAIDs",
  onb_home_meds: "Medicines you currently have at home",
  onb_home_meds_ph: "e.g. Tylenol, Claritin",
  onb_lifestyle: "Lifestyle",
  onb_lifestyle_desc: "These affect how some OTC medicines work and what's safe.",
  onb_smoking: "Smoking / tobacco",
  onb_alcohol: "Alcohol",
  onb_drugs: "Recreational drugs",
  onb_drugs_ph: "e.g. None, cannabis",

  onb_review_title: "Looks good?",
  onb_review_desc: "Review and save your profile.",
  onb_save_profile: "Save profile",

  // Genders
  g_male: "Male",
  g_female: "Female",
  g_other: "Other",
  g_prefer_not: "Prefer not to say",

  // Smoking
  smk_never: "Never",
  smk_former: "Former",
  smk_occasional: "Occasional",
  smk_daily: "Daily",

  // Alcohol
  alc_none: "None",
  alc_occasional: "Occasional (≤2/week)",
  alc_moderate: "Moderate (3-7/week)",
  alc_heavy: "Heavy (8+/week)",

  // Conditions
  cond_hypertension: "Hypertension",
  cond_diabetes2: "Type 2 Diabetes",
  cond_asthma: "Asthma",
  cond_heart: "Heart Disease",
  cond_kidney: "Kidney Disease",
  cond_liver: "Liver Disease",
  cond_thyroid: "Thyroid Disorder",
  cond_gerd: "GERD/Acid Reflux",

  // Symptom
  sym_title: "What's the symptom?",
  sym_profile: "Profile: {name}",
  sym_voice_title: "Talk to OTC&Me instead",
  sym_voice_desc: "Hands-free voice conversation — one question at a time, no typing needed.",
  sym_voice_start: "Start voice",
  sym_voice_stop: "Stop",
  sym_describe: "Describe your symptom or illness",
  sym_describe_ph: "e.g. runny nose and sore throat for 2 days",
  sym_assistant: "OTC&Me Assistant",
  sym_loading_questions: "Thinking of clarifying questions…",
  sym_loading_reviewing: "Reviewing your answers…",
  sym_loading_finding: "Finding the safest options for you…",
  sym_type_answer: "Type your answer…",
  sym_question_n: "Question {n}",
  sym_thanks_thinking: "Thanks. Thinking of a few quick questions…",
  sym_thanks_short: "Thanks for sharing. A few quick questions so I can point you to the safest option.",
  sym_saved_to_profile:
    "Thanks — I've saved that to your profile so you don't have to repeat it next time.",
  sym_have_what_need: "Great, I have what I need. Finding the safest options for you now.",

  // Voice flow lines
  voice_greeting: "Hello, how can I help you today?",
  voice_rephrase_main: "No worries — in your own words, what's bothering you today?",
  voice_didnt_catch: "Sorry, I didn't quite catch that. Could you say it once more?",
  voice_thanks_sharing:
    "Thanks for sharing. I'd like to ask a few quick questions so I can point you to the safest option.",
  voice_have_what_need:
    "Great, I have what I need. Give me a moment to find the safest options for you.",
  voice_cant_hear: "I'm having trouble hearing you. Let's try typing instead.",
  voice_error: "Sorry, something went wrong. You can continue by typing.",
  voice_speaking: "Assistant is speaking…",
  voice_listening: "Listening",
  voice_thinking: "Thinking…",

  // Recommendations
  rec_title: "Recommended categories",
  rec_based_on: "Based on: {symptom}",
  rec_generate_summary: "Generate Pharmacist Summary Card",
  rec_back_symptom: "Back to symptom check",
  rec_none: "No recommendations found. Start a new symptom check to see options.",
  rec_why: "Why",
  rec_dosage: "Dosage guidance",
  rec_examples: "Examples",
  rec_find_nearby: "Find {ingredient} nearby",
  rec_learn_more: "Learn more — products & prices",
  rec_loading_products: "Loading products…",
  rec_products_containing: "Products containing {name}",
  status_safe: "Safe",
  status_consult: "Consult Pharmacist",
  status_not_recommended: "Not Recommended",

  // Voice — recommendations announcement
  voice_rec_one: "Here are your recommendations. The top option is {first}.",
  voice_rec_two: "Here are your recommendations. The top option is {first}, followed by {second}.",
  voice_rec_many:
    "Here are your recommendations. The top option is {first}, followed by {middle}, and {last}.",

  // Safety
  saf_title: "Is this medicine safe for me?",
  saf_upload: "Upload a photo of the label or box",
  saf_tap_photo: "Tap to take a photo or upload",
  saf_file_types: "PNG, JPG up to 10MB",
  saf_reading: "Reading the label…",
  saf_or: "OR",
  saf_type_name: "Type the medication name",
  saf_name_ph: "e.g. Ibuprofen 200mg",
  saf_check: "Check safety",
  saf_checking: "Checking against your profile…",
  saf_yes: "Yes — Safe",
  saf_caution: "Use with caution",
  saf_no: "No — Avoid",
  saf_identified: "Identified: {name}",
  saf_couldnt_read: "Couldn't read the label — type the name manually.",

  // Summary
  sum_title: "Pharmacist summary",
  sum_save_card: "Save this card (screenshot or print)",
  sum_dashboard: "Dashboard",
  sum_patient: "Patient Profile",
  sum_today: "Today's Query",
  sum_clarification: "Clarification: {text}",
  sum_recommendation: "AI Recommendation / Safety Result",
  sum_questions: "Questions to Ask Your Pharmacist",
  sum_pharmacist_q:
    `"Please review this OTC selection considering my history of {conditions} and my current use of {rx}. Are there any interactions or dosage adjustments I should be aware of?"`,
  sum_no_rx: "no prescription medications",
  sum_footer:
    "This summary was generated by OTC&Me for informational purposes only and does not constitute medical advice. Always consult your pharmacist or physician before taking any medication.",
  sum_print: "Print / Save as PDF",
  sum_name: "Name",
  sum_age: "Age",
  sum_chronic: "Chronic conditions",
  sum_allergies_label: "Allergies",
  sum_current_rx: "Current prescriptions",
  sum_none_reported: "None reported",
  sum_gender: "Gender",
  sum_weight: "Weight",
  sum_height: "Height",

  // Wishlist
  wish_title: "My wishlist",
  wish_empty: "Nothing saved yet.",

  // Settings
  set_title: "Settings",
  set_save_changes: "Save changes",
  set_delete: "Delete profile",
};

const zh: Partial<typeof en> = {
  // Common
  back: "返回",
  back_to_dashboard: "返回主页",
  continue: "继续",
  send: "发送",
  save: "保存",
  cancel: "取消",
  loading: "加载中…",
  none: "无",
  optional: "可选",
  language: "语言",

  // TopNav
  nav_switch_profile: "切换档案",
  nav_settings: "设置",
  nav_add_profile: "新建档案",

  // Dashboard
  home_active_profile: "当前档案",
  home_no_conditions: "无慢性疾病",
  home_rx: "处方药",
  home_allergies: "过敏",
  home_home_meds: "家中常备",
  home_how_help: "今天需要什么帮助?",
  home_symptom_title: "我有症状 — 该买什么药?",
  home_symptom_desc: "告诉我们您的情况,我们会推荐更安全的非处方药。",
  home_safety_title: "这种药对我安全吗?",
  home_safety_desc: "拍下药盒照片或输入名称,根据您的档案核对适用性。",
  home_wishlist_title: "我的收藏",
  home_wishlist_desc: "您从附近药房保存的药品。",
  home_recent: "最近记录",
  home_no_history: "暂无咨询记录。{name} 的症状检查和安全核对结果将显示在此处。",
  home_have_at_home: "您家中常备的药品:",
  home_at_home: "家中常备:",
  home_disclaimer: "OTC&Me 仅提供信息参考,不能替代您的药剂师或医生的建议。",
  home_symptom_check: "症状检查",
  home_safety_check: "安全核对",

  // Onboarding
  onb_step_of: "第 {n} 步,共 4 步",
  onb_who_title: "您要为谁建立档案?",
  onb_who_desc: "我们将为这位用户提供个性化的非处方药指导。",
  onb_self: "我自己",
  onb_self_taken: "您已有个人档案,请在设置中编辑。",
  onb_self_desc: "供您本人使用的个人档案。",
  onb_loved: "家人",
  onb_loved_desc: "为父母、孩子或伴侣建立档案。",
  onb_their_name: "对方姓名",
  onb_name_placeholder: "例如:妈妈、小杰",

  onb_basic_title: "基本信息",
  onb_basic_desc: "用于调整剂量建议。",
  onb_age: "年龄",
  onb_gender: "性别",
  onb_weight: "体重",
  onb_height: "身高",
  onb_weight_ph: "例如:65 公斤",
  onb_height_ph: "例如:170 厘米",

  onb_health_title: "健康背景",
  onb_health_desc: "请勾选所有相关项。文字栏目为选填。",
  onb_chronic: "慢性疾病",
  onb_other: "其他",
  onb_other_ph: "描述其他疾病",
  onb_rx: "处方药",
  onb_rx_ph: "例如:每日服用赖诺普利 10 毫克",
  onb_allergies: "已知过敏",
  onb_allergies_ph: "例如:青霉素、磺胺、非甾体抗炎药",
  onb_home_meds: "目前家中常备的药品",
  onb_home_meds_ph: "例如:泰诺、开瑞坦",
  onb_lifestyle: "生活方式",
  onb_lifestyle_desc: "这些会影响某些非处方药的效果和安全性。",
  onb_smoking: "吸烟 / 烟草",
  onb_alcohol: "饮酒",
  onb_drugs: "其他药物",
  onb_drugs_ph: "例如:无、大麻",

  onb_review_title: "信息无误吗?",
  onb_review_desc: "请确认并保存您的档案。",
  onb_save_profile: "保存档案",

  // Genders
  g_male: "男",
  g_female: "女",
  g_other: "其他",
  g_prefer_not: "不愿透露",

  // Smoking
  smk_never: "从不",
  smk_former: "曾经",
  smk_occasional: "偶尔",
  smk_daily: "每日",

  // Alcohol
  alc_none: "无",
  alc_occasional: "偶尔(每周≤2次)",
  alc_moderate: "适量(每周3-7次)",
  alc_heavy: "大量(每周8次以上)",

  // Conditions
  cond_hypertension: "高血压",
  cond_diabetes2: "2型糖尿病",
  cond_asthma: "哮喘",
  cond_heart: "心脏病",
  cond_kidney: "肾病",
  cond_liver: "肝病",
  cond_thyroid: "甲状腺疾病",
  cond_gerd: "胃食管反流 / 反酸",

  // Symptom
  sym_title: "您有什么症状?",
  sym_profile: "档案:{name}",
  sym_voice_title: "改用语音对话",
  sym_voice_desc: "免提语音对话——一次一个问题,无需打字。",
  sym_voice_start: "开始语音",
  sym_voice_stop: "停止",
  sym_describe: "描述您的症状或不适",
  sym_describe_ph: "例如:流鼻涕和喉咙痛已 2 天",
  sym_assistant: "OTC&Me 助手",
  sym_loading_questions: "正在准备澄清问题…",
  sym_loading_reviewing: "正在审阅您的回答…",
  sym_loading_finding: "正在为您寻找最安全的方案…",
  sym_type_answer: "请输入您的回答…",
  sym_question_n: "问题 {n}",
  sym_thanks_thinking: "谢谢。正在准备几个简短的问题…",
  sym_thanks_short: "感谢分享。我会问几个简短的问题,以便为您推荐最安全的方案。",
  sym_saved_to_profile: "已记下,下次就不用再说一遍了。",
  sym_have_what_need: "好,信息够了。马上为您查找最安全的方案。",

  // Voice flow
  voice_greeting: "您好,今天有什么可以帮您的?",
  voice_rephrase_main: "没关系——请用自己的话告诉我,您今天哪里不舒服?",
  voice_didnt_catch: "抱歉,我没听清,能再说一次吗?",
  voice_thanks_sharing: "感谢分享。我想问几个简短的问题,以便为您推荐最安全的方案。",
  voice_have_what_need: "好,信息够了。请稍等,我为您查找最安全的方案。",
  voice_cant_hear: "我听不清您说话,我们改用文字输入吧。",
  voice_error: "抱歉,出了点问题。您可以改用文字继续。",
  voice_speaking: "助手正在说话…",
  voice_listening: "正在聆听",
  voice_thinking: "思考中…",

  // Recommendations
  rec_title: "推荐药物类别",
  rec_based_on: "根据:{symptom}",
  rec_generate_summary: "生成药剂师参考卡",
  rec_back_symptom: "返回症状检查",
  rec_none: "暂无推荐结果。请重新进行症状检查。",
  rec_why: "原因",
  rec_dosage: "用药指导",
  rec_examples: "示例药品",
  rec_find_nearby: "查找附近的 {ingredient}",
  rec_learn_more: "了解更多 — 产品与价格",
  rec_loading_products: "加载产品中…",
  rec_products_containing: "含 {name} 的产品",
  status_safe: "安全",
  status_consult: "咨询药剂师",
  status_not_recommended: "不推荐",

  voice_rec_one: "这是为您推荐的方案。首选是 {first}。",
  voice_rec_two: "这是为您推荐的方案。首选是 {first},其次是 {second}。",
  voice_rec_many: "这是为您推荐的方案。首选是 {first},其次是 {middle},最后是 {last}。",

  // Safety
  saf_title: "这种药对我安全吗?",
  saf_upload: "上传药品标签或包装照片",
  saf_tap_photo: "点击拍照或上传",
  saf_file_types: "PNG、JPG,不超过 10MB",
  saf_reading: "正在识别标签…",
  saf_or: "或",
  saf_type_name: "输入药品名称",
  saf_name_ph: "例如:布洛芬 200 毫克",
  saf_check: "检查安全性",
  saf_checking: "正在对照您的档案核查…",
  saf_yes: "可以 — 安全",
  saf_caution: "请谨慎使用",
  saf_no: "不可以 — 请避免",
  saf_identified: "已识别:{name}",
  saf_couldnt_read: "无法识别标签——请手动输入名称。",

  // Summary
  sum_title: "药剂师参考摘要",
  sum_save_card: "保存此卡片(截屏或打印)",
  sum_dashboard: "主页",
  sum_patient: "患者档案",
  sum_today: "今日咨询",
  sum_clarification: "补充说明:{text}",
  sum_recommendation: "AI 推荐 / 安全结果",
  sum_questions: "向药剂师询问的问题",
  sum_pharmacist_q:
    "「请根据我有 {conditions} 的病史以及目前正在使用 {rx} 的情况,审核这个非处方药选择。是否存在我应注意的相互作用或剂量调整?」",
  sum_no_rx: "无处方药",
  sum_footer:
    "本摘要由 OTC&Me 生成,仅供参考,不构成医疗建议。服用任何药物前请咨询您的药剂师或医生。",
  sum_print: "打印 / 保存为 PDF",
  sum_name: "姓名",
  sum_age: "年龄",
  sum_chronic: "慢性疾病",
  sum_allergies_label: "过敏",
  sum_current_rx: "目前处方药",
  sum_none_reported: "未报告",
  sum_gender: "性别",
  sum_weight: "体重",
  sum_height: "身高",

  // Wishlist
  wish_title: "我的收藏",
  wish_empty: "尚未收藏任何药品。",

  // Settings
  set_title: "设置",
  set_save_changes: "保存更改",
  set_delete: "删除档案",
};

export const translations: { en: typeof en; zh: typeof en } = {
  en,
  // Fall back to English for any key not yet translated.
  zh: { ...en, ...zh } as typeof en,
};

export type TranslationKey = keyof typeof en;
