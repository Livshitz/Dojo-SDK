import { log, LogLevel } from 'libx.js/build/modules/log';
import { Recipe_Intro as Recipe } from '.';

// log.filterLevel = LogLevel.Fatal;

beforeEach(() => {});

describe('Recipe: <recipe-name>', () => {
    test('Test case: <recipe-test-case> - Basic', async () => {
        const recipe = new Recipe();
        await recipe.setup();
        await recipe.run();
        const journal = recipe.getJournal();
        expect(journal).toEqual(['ctor', 'setup:start', 'setup:end', 'run:completed']);
        await recipe.shutdown();
    });
});
