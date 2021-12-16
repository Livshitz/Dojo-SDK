import { node } from 'libx.js/build/node';
import { log } from 'libx.js/build/modules/log';
import { EventsStream } from 'libx.js/build/modules/EventsStream';
import { NotImplemented } from 'libx.js/build/helpers/Exceptions';
import { Master } from './Master';

// This is a template
export class BaseRecipe implements IRecipe {
    public master: Master;
    public journal = new EventsStream<string>();
    public problemStatement = `
    ========================================
    This is where you describe the challenge.
    ========================================
    `;

    public constructor(public options?: Partial<ModuleOptions>) {
        this.options = { ...new ModuleOptions(), ...options };

        this.master = new Master();
    }

    public async setup(): Promise<void> {
        throw new NotImplemented();
    }

    public async run() {
        throw new NotImplemented();
    }

    public printJournal() {
        const report = this.journal.getAll((ev) => ev.payload);
        log.i('Report: ', report);
        return report;
    }
}

export interface IRecipe {
    master: Master;
    problemStatement: string;
    journal: EventsStream<string>;
    printJournal();
    setup(): Promise<void>;
}

export class ModuleOptions {}
