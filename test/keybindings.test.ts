import { describe, it, expect, vi, beforeEach } from 'vitest';
import { registerKeybindings } from '../src/keybindings';

describe('Keybindings', () => {
  beforeEach(() => {
    // Mock the game.keybindings.register method
    global.game = {
      keybindings: {
        register: vi.fn()
      }
    };

    // Mock CONST
    global.CONST = {
      KEYBINDING_PRECEDENCE: {
        PRIORITY: 0,
        NORMAL: 1,
        DEFERRED: 2
      }
    };
  });

  describe('registerKeybindings', () => {
    it('should register the party sheet keybinding', () => {
      registerKeybindings();

      expect(game.keybindings.register).toHaveBeenCalledWith(
        'journeys-and-jamborees',
        'openPartySheet',
        expect.objectContaining({
          name: 'J&J.Keybindings.OpenPartySheet',
          hint: 'J&J.Keybindings.OpenPartySheetHint',
          editable: [{ key: 'KeyP' }],
          precedence: 1 // CONST.KEYBINDING_PRECEDENCE.NORMAL
        })
      );
    });

    it('should register a function for onDown', () => {
      registerKeybindings();

      const call = vi.mocked(game.keybindings.register).mock.calls[0];
      const options = call[2];
      expect(options.onDown).toBeTypeOf('function');
    });
  });
});