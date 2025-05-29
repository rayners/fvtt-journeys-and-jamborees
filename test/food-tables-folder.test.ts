import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { FoodTablesManager } from '../src/food-tables';

describe('FoodTablesManager Folder Organization', () => {
  let tablesManager: FoodTablesManager;
  let mockFolder: any;
  let mockTables: any[];

  beforeEach(() => {
    // Setup Foundry mocks
    vi.clearAllMocks();
    tablesManager = FoodTablesManager.getInstance();

    // Mock folder
    mockFolder = {
      id: 'test-folder-id',
      name: 'Journeys & Jamborees',
      type: 'RollTable'
    };

    // Mock created tables
    mockTables = [];

    // Mock Folder.create
    (global as any).Folder = {
      create: vi.fn().mockResolvedValue(mockFolder)
    };

    // Mock RollTable.create to capture folder assignment
    (global as any).RollTable = {
      create: vi.fn().mockImplementation(data => {
        const table = { id: 'test-table-id', ...data };
        mockTables.push(table);
        return Promise.resolve(table);
      })
    };

    // Mock game.folders.find
    (global as any).game.folders = {
      find: vi.fn().mockReturnValue(null) // No existing folder
    };

    // Mock game.tables.find
    (global as any).game.tables = {
      find: vi.fn().mockReturnValue(null) // No existing tables
    };

    // Mock game.user.isGM
    (global as any).game.user = {
      isGM: true
    };

    // Mock game.system
    (global as any).game.system = {
      id: 'test-system'
    };

    // Mock game.modules.get
    (global as any).game.modules = {
      get: vi.fn().mockReturnValue({ active: false })
    };
  });

  afterEach(() => {
    // Reset the singleton instance
    (FoodTablesManager as any).instance = null;
    mockTables = [];
  });

  it('should create a Journeys & Jamborees folder for RollTables', async () => {
    // Act
    await tablesManager.getHuntingTable();

    // Assert
    expect(Folder.create).toHaveBeenCalledWith({
      name: 'Journeys & Jamborees',
      type: 'RollTable',
      sorting: 'a',
      color: '#4b0082',
      description: 'RollTables created by the Journeys & Jamborees module'
    });
  });

  it('should assign hunting table to J&J folder', async () => {
    // Act
    await tablesManager.getHuntingTable();

    // Assert
    expect(RollTable.create).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'J&J Hunting Results',
        folder: mockFolder.id
      })
    );
  });

  it('should assign foraging table to J&J folder', async () => {
    // Act
    await tablesManager.getForagingTable();

    // Assert
    expect(RollTable.create).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'J&J Foraging Results',
        folder: mockFolder.id
      })
    );
  });

  it('should reuse existing folder if found', async () => {
    // Arrange - mock existing folder
    (global as any).game.folders.find = vi.fn().mockReturnValue(mockFolder);

    // Act
    await tablesManager.getHuntingTable();

    // Assert
    expect(Folder.create).not.toHaveBeenCalled();
    expect(RollTable.create).toHaveBeenCalledWith(
      expect.objectContaining({
        folder: mockFolder.id
      })
    );
  });

  it('should handle folder creation failure gracefully', async () => {
    // Arrange - mock folder creation failure
    (global as any).Folder.create = vi.fn().mockRejectedValue(new Error('Permission denied'));

    // Act
    await tablesManager.getHuntingTable();

    // Assert - should still create table with null folder
    expect(RollTable.create).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'J&J Hunting Results',
        folder: null
      })
    );
  });

  it('should not create folder if user is not GM', async () => {
    // Arrange
    (global as any).game.user.isGM = false;

    // Act
    await tablesManager.getHuntingTable();

    // Assert
    expect(Folder.create).not.toHaveBeenCalled();
    expect(RollTable.create).toHaveBeenCalledWith(
      expect.objectContaining({
        folder: null
      })
    );
  });
});
