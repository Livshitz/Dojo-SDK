import { NotImplemented } from 'libx.js/build/helpers/Exceptions';

export class StreamProcessor {
    // Should mimic Kafka / Amazon Kinesis
    public constructor(public options?: Partial<ModuleOptions>) {
        this.options = { ...new ModuleOptions(), ...options };
        throw NotImplemented;
    }
}

export class ModuleOptions {}
