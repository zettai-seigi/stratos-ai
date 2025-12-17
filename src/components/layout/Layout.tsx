import React, { useState, useEffect, useRef } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Header } from './Header';

export const Layout: React.FC = () => {
  const [headerVisible, setHeaderVisible] = useState(true);
  const [sidebarExpanded, setSidebarExpanded] = useState(true);
  const mainRef = useRef<HTMLElement>(null);
  const lastScrollTop = useRef(0);

  useEffect(() => {
    const mainElement = mainRef.current;
    if (!mainElement) return;

    const handleScroll = () => {
      const scrollTop = mainElement.scrollTop;

      // Show header when at top or scrolling up
      if (scrollTop <= 10) {
        setHeaderVisible(true);
      } else if (scrollTop > lastScrollTop.current && scrollTop > 50) {
        // Scrolling down and past threshold - hide header
        setHeaderVisible(false);
      } else if (scrollTop < lastScrollTop.current) {
        // Scrolling up - show header
        setHeaderVisible(true);
      }

      lastScrollTop.current = scrollTop;
    };

    mainElement.addEventListener('scroll', handleScroll, { passive: true });
    return () => mainElement.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="flex min-h-screen bg-bg-primary">
      <Sidebar expanded={sidebarExpanded} onExpandedChange={setSidebarExpanded} />
      <div className={`fixed top-0 right-0 bottom-0 flex flex-col overflow-hidden transition-all duration-200 ${sidebarExpanded ? 'left-36' : 'left-8'}`}>
        <Header visible={headerVisible} />
        <main ref={mainRef} className="flex-1 px-6 py-4 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
