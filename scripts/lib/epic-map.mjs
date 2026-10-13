// Ánh xạ nguồn LAB-4 → epic LAB-5 (DR-03). Epic = 12 FG của LAB-1 + E-13 外部連携基盤 · E-14 環境・運用基盤 · E-15 顧客確認.
// Khoá FG-01…FG-12 ứng với nhãn epic:E-01…E-12 ở task-breakdown.md §1.5; E-13/14/15 giữ nguyên.
// Ánh xạ ở đây là suy luận (INFERRED); P2 chỉnh từng issue nếu nội dung spec nói khác.

export const EPICS = {
  'FG-01': 'マスタ管理', 'FG-02': '入荷・検品・ロット生成', 'FG-03': '在庫・ロケーション・隔離',
  'FG-04': '受注・アロケーション・ピッキング', 'FG-05': '配送・POD・クレーム', 'FG-06': 'ルート計画・拘束時間',
  'FG-07': '温度監視・逸脱・HACCP', 'FG-08': 'トレーサビリティ・回収', 'FG-09': 'レポート・監査エクスポート',
  'FG-10': '外部インターフェース', 'FG-11': '認証・権限・監査ログ', 'FG-12': 'データ移行・カットオーバー',
  'E-13': '外部連携基盤', 'E-14': '環境・運用基盤', 'E-15': '顧客確認',
};

// Thư mục feature của spec LAB-4 → FG mặc định (administration chứa FG-10/11/12 → cần mã F để quyết)
export const FEATURE_FG = {
  'master-data': 'FG-01', receiving: 'FG-02', inventory: 'FG-03', 'order-shipping': 'FG-04', delivery: 'FG-05',
  dispatch: 'FG-06', 'temperature-quality': 'FG-07', 'trace-recall': 'FG-08', 'report-audit': 'FG-09', administration: null,
};

// Tiền tố mã yêu cầu RFP → epic; khớp đầu tiên thắng (OPS-LAW, OPS-ENV, OPS-TEST đứng trước OPS- → PJ).
// 'PJ' = việc dự án ngoài backlog (nghiệm thu ACC-, đào tạo/quản trị OPS-)
const REQ_PREFIX = [
  [/^(FR-REC|DR-LOT)/, 'FG-02'], [/^FR-INV/, 'FG-03'], [/^(BR-FEFO|BR-EXP|BR-DELWIN|BR-DATE|DR-HIST)/, 'FG-04'],
  [/^(FR-OUT|BR-POD|DR-POD)/, 'FG-05'], [/^(FR-SCH|DR-ROUTE|OPS-LAW)/, 'FG-06'], [/^(FR-TEMP|BR-TEMP|BR-HACCP|DR-TEMP|IF-LOG)/, 'FG-07'],
  [/^(FR-TRC|BR-TRACE|DR-TRACE)/, 'FG-08'], [/^(FR-RPT|DR-RET)/, 'FG-09'], [/^DR-MST/, 'FG-01'], [/^IF-(ERP|MAP|MAIL|ARCH)/, 'FG-10'],
  [/^(IF-IDP|NFR-SEC|NFR-AUD|DR-PRIV)/, 'FG-11'], [/^DR-MIG/, 'FG-12'],
  [/^(NFR-|OPS-ENV|OPS-TEST)/, 'E-14'], [/^(ACC-|OPS-)/, 'PJ'],
];
export const epicOfRequirement = (id) => REQ_PREFIX.find(([re]) => re.test(id))?.[1] ?? null;

// ADR → epic chứa việc hệ quả; null = quy ước kiến trúc, đi vào DoD chứ không thành issue riêng.
// ADR-0009 → FG-11 (dựng SSO); spike PoC Entra ID của chính ADR đó là issue E-13 (PR-D-03), tạo ở P2, không đi qua bảng này.
export const ADR_EPIC = {
  'ADR-0001': 'E-14', 'ADR-0002': 'FG-11', 'ADR-0003': null, 'ADR-0004': 'FG-11', 'ADR-0005': null, 'ADR-0006': 'FG-01',
  'ADR-0007': 'E-13', 'ADR-0008': 'E-13', 'ADR-0009': 'FG-11', 'ADR-0010': 'FG-05', 'ADR-0011': 'E-14', 'ADR-0012': 'FG-09',
  'ADR-0013': 'E-14', 'ADR-0014': 'E-14',
};

// Việc chỉ là hỏi/xin khách xác nhận → E-15
export const isClientQuestion = (text) => /^(\*\*)?(Xin|Hỏi|hỏi|Yêu cầu) khách/.test(text.trim());
