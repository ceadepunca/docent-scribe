import { useEffect } from 'react';

type HotkeyCallback = (event: KeyboardEvent) => void;
type HotkeyMap = Record<string, HotkeyCallback>;

/**
 * A hook for handling keyboard shortcuts.
 * @param hotkeys - A map of hotkey combinations to callback functions.
 * e.g. { 'alt+g': () => console.log('Alt+G pressed') }
 */
export const useHotkeys = (hotkeys: HotkeyMap, disabled = false) => {
  useEffect(() => {
    if (disabled) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      const { key, altKey, ctrlKey, shiftKey } = event;
      
      // Construct the hotkey string in a consistent order
      const parts: string[] = [];
      if (altKey) parts.push('alt');
      if (ctrlKey) parts.push('ctrl');
      if (shiftKey) parts.push('shift');
      parts.push(key.toLowerCase());
      
      const hotkey = parts.join('+');

      if (hotkeys[hotkey]) {
        event.preventDefault();
        hotkeys[hotkey](event);
      }
    };

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [hotkeys, disabled]);
};
