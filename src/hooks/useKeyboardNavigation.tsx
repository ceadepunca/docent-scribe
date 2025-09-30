import { useEffect, useCallback } from 'react';

type TabType = 'period' | 'fray' | 'enet' | 'documents' | 'summary';

interface UseKeyboardNavigationProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
  tabs: TabType[];
  disabled?: boolean;
}

export const useKeyboardNavigation = ({
  activeTab,
  onTabChange,
  tabs,
  disabled = false
}: UseKeyboardNavigationProps) => {
  const handleKeyPress = useCallback((event: KeyboardEvent) => {
    // Only handle if Control key is pressed and not disabled
    if (!event.ctrlKey || disabled) return;
    
    // Find current tab index
    const currentIndex = tabs.indexOf(activeTab);
    if (currentIndex === -1) return;
    
    let newIndex: number;
    
    if (event.key === 'ArrowLeft') {
      // Go to previous tab (wrap around to last tab if at first)
      newIndex = currentIndex === 0 ? tabs.length - 1 : currentIndex - 1;
      event.preventDefault();
      event.stopPropagation();
    } else if (event.key === 'ArrowRight') {
      // Go to next tab (wrap around to first tab if at last)
      newIndex = currentIndex === tabs.length - 1 ? 0 : currentIndex + 1;
      event.preventDefault();
      event.stopPropagation();
    } else {
      return;
    }
    
    const newTab = tabs[newIndex];
    onTabChange(newTab);
  }, [activeTab, onTabChange, tabs, disabled]);

  useEffect(() => {
    // Add event listener with capture to intercept before other handlers
    document.addEventListener('keydown', handleKeyPress, { capture: true });
    
    // Cleanup
    return () => {
      document.removeEventListener('keydown', handleKeyPress, { capture: true });
    };
  }, [handleKeyPress]);

  // Return function to manually navigate
  const navigateToTab = useCallback((direction: 'prev' | 'next') => {
    const currentIndex = tabs.indexOf(activeTab);
    if (currentIndex === -1) return;
    
    let newIndex: number;
    if (direction === 'prev') {
      newIndex = currentIndex === 0 ? tabs.length - 1 : currentIndex - 1;
    } else {
      newIndex = currentIndex === tabs.length - 1 ? 0 : currentIndex + 1;
    }
    
    const newTab = tabs[newIndex];
    onTabChange(newTab);
  }, [activeTab, onTabChange, tabs]);

  return {
    navigateToTab,
    currentTabIndex: tabs.indexOf(activeTab),
    totalTabs: tabs.length
  };
};