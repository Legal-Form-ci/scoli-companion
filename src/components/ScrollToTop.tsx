import { useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";

const ScrollToTop = () => {
  const { pathname, hash } = useLocation();
  const prevPathname = useRef(pathname);

  useEffect(() => {
    // Handle hash navigation (scroll to element)
    if (hash) {
      // Small delay to ensure DOM is ready
      setTimeout(() => {
        const element = document.querySelector(hash);
        if (element) {
          const headerOffset = 80; // Account for fixed navbar
          const elementPosition = element.getBoundingClientRect().top;
          const offsetPosition = elementPosition + window.pageYOffset - headerOffset;
          
          window.scrollTo({
            top: offsetPosition,
            behavior: "smooth"
          });
        }
      }, 100);
      return;
    }

    // Only scroll to top on actual page navigation (different pathname)
    if (prevPathname.current !== pathname) {
      // Use instant scroll for page changes to avoid jarring animation
      window.scrollTo({ top: 0, behavior: "instant" });
      prevPathname.current = pathname;
    }
  }, [pathname, hash]);

  return null;
};

export default ScrollToTop;
