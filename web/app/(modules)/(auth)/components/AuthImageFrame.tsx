// Tailwind's `xl` breakpoint, the width from which the frame is shown.
const XL_MEDIA = '(min-width: 1280px)';
// A 1×1 transparent gif: the fallback below xl, so nothing is fetched there.
const EMPTY_IMAGE =
  'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';
// Pre-sized copies of `app/assets/bitewise.webp` (no image optimizer in a
// static export); the frame is at most half of 1408px.
const SRC_SET = '/images/auth-704.webp 704w, /images/auth-1080.webp 1080w';
const SIZE = 704;

const AuthImageFrame = () => (
  // The image is the LCP element at xl, so it loads eagerly at high priority.
  // Browsers fetch eager images even inside a `display: none` parent, so the
  // real source is only offered to xl widths through `<picture>`.
  <section className="hidden overflow-hidden xl:block xl:max-w-[50%] xl:rounded-r-lg">
    <picture>
      <source media={XL_MEDIA} srcSet={SRC_SET} sizes={`${SIZE}px`} />
      <img
        src={EMPTY_IMAGE}
        alt="Meal image"
        width={SIZE}
        height={SIZE}
        loading="eager"
        fetchPriority="high"
        decoding="async"
      />
    </picture>
  </section>
);

export default AuthImageFrame;
