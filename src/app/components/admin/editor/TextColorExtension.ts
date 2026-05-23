/**
 * Custom TipTap TextColor mark extension.
 * Applies an inline color to selected text via <span style="color: …">.
 *
 * We import Mark and mergeAttributes from @tiptap/react because
 * @tiptap/react re-exports everything from @tiptap/core via
 * `export * from '@tiptap/core'`, so no direct @tiptap/core symlink is needed.
 */
import { Mark, mergeAttributes } from '@tiptap/react';

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    textColor: {
      /** Set the text color on the selected text */
      setTextColor: (color: string) => ReturnType;
      /** Remove the text color from the selected text */
      unsetTextColor: () => ReturnType;
    };
  }
}

export const TextColor = Mark.create({
  name: 'textColor',

  addOptions() {
    return {
      HTMLAttributes: {},
    };
  },

  addAttributes() {
    return {
      color: {
        default: null,
        parseHTML: (element: HTMLElement) => element.style?.color || null,
        renderHTML: (attributes: { color?: string | null }) => {
          if (!attributes.color) return {};
          return { style: `color: ${attributes.color}` };
        },
      },
    };
  },

  /**
   * Match <span style="…"> elements that carry a color property.
   * Using 'span[style]' ensures we only match spans that actually have
   * an inline style attribute.
   */
  parseHTML() {
    return [
      {
        tag: 'span[style]',
        getAttrs: (node: HTMLElement | string) => {
          if (typeof node === 'string') return false;
          const color = (node as HTMLElement).style?.color;
          return color ? { color } : false;
        },
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return ['span', mergeAttributes(this.options.HTMLAttributes, HTMLAttributes), 0];
  },

  addCommands() {
    return {
      setTextColor:
        (color: string) =>
        ({ commands }: any) => {
          return commands.setMark(this.name, { color });
        },
      unsetTextColor:
        () =>
        ({ commands }: any) => {
          return commands.unsetMark(this.name);
        },
    };
  },
});