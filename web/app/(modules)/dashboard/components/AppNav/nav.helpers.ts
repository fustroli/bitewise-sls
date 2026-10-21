// `trailingSlash` pages may report their path with the slash.
const withoutTrailingSlash = (path: string) =>
  path.length > 1 ? path.replace(/\/$/, '') : path;

/** The dashboard's own item is active only on itself; others on sub-pages too. */
export const isNavItemActive = (
  pathname: string,
  href: string,
  route: string,
) => {
  const path = withoutTrailingSlash(pathname);
  return route === ''
    ? path === href
    : path === href || path.startsWith(`${href}/`);
};
