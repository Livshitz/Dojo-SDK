import { log } from 'libx.js/build/modules/log';
import { EventsStream } from 'libx.js/build/modules/EventsStream';
import { NotImplemented } from 'libx.js/build/helpers/Exceptions';
import { Matrix } from './Matrix';

// This is a template
export class BaseRecipe implements IRecipe {
    public matrix: Matrix;
    public journal = new EventsStream<string>();
    public problemStatement = `
    ========================================
    This is where you describe the challenge.
    ========================================
    `;

    public constructor(public options?: Partial<ModuleOptions>) {
        this.options = { ...new ModuleOptions(), ...options };

        this.matrix = new Matrix();
    }

    public async setup(): Promise<void> {
        throw new NotImplemented();
    }

    public async run() {
        throw new NotImplemented();
    }

    public getJournal() {
        const report = this.journal.getAll((ev) => ev.payload);
        return report;
    }

    public async shutdown() {
        await this.matrix.shutdown();
    }
}

export interface IRecipe {
    matrix: Matrix;
    problemStatement: string;
    journal: EventsStream<string>;
    getJournal();
    setup(): Promise<void>;
}

export class ModuleOptions {}
