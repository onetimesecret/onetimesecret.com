/**
 * @file torphStub.ts
 * @description Stands in for `torph/vue` in jsdom tests:
 * `vi.mock("torph/vue", () => import("../../helpers/torphStub"))`.
 *
 * TextMorph needs `matchMedia` and the Web Animations API as soon as it
 * attaches, and jsdom has neither. This renders the text as it is, without
 * morphing, and passes attributes such as `data-hero-item` through.
 */

import { defineComponent, h } from "vue";

export const TextMorph = defineComponent({
  name: "TextMorph",
  props: {
    text: { type: String, required: true },
    locale: { type: String, default: undefined },
    disabled: { type: Boolean, default: false },
  },
  setup: (props) => () => h("span", props.text),
});
