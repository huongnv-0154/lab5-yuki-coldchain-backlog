// Bộ sinh bảng cho các block <!-- GENERATED:<tên> --> trong 6 file nộp.
// Mỗi renderer nhận ctx { snapshot, data(name), options } (options = k=v ghi trong thẻ GENERATED) và trả markdown;
// renderer theo file nộp nằm ở breakdown- / estimate- / progress- / readme-renderers.mjs.

import { breakdownRenderers } from './breakdown-renderers.mjs';
import { estimateRenderers } from './estimate-renderers.mjs';
import { progressRenderers } from './progress-renderers.mjs';
import { readmeRenderers } from './readme-renderers.mjs';

export const renderers = {
  ...breakdownRenderers,
  ...estimateRenderers,
  ...progressRenderers,
  ...readmeRenderers,
};
