import { libx } from 'libx.js/build/bundles/node.essentials';
import { log } from 'libx.js/build/modules/log';
import { MessageQueueManager } from '../../src/MessageQueue/MessageQueueManager';
import { Publisher } from '../../src/MessageQueue/Publisher';

class MyItem {
    public str: string;
    public num: number;
}

beforeAll(async () => {});

test('1 worker should treat a message', async (done) => {
    const mqMgr = new MessageQueueManager();
    const queue1 = await mqMgr.createQueue<MyItem>('queue1');
    mqMgr.addWorker<MyItem>(
        'queue1',
        async (item, instanceIdentifier) => {
            done();
        },
        1
    );
    queue1.enqueue({ num: 11, str: 's11' });
    // expect(main.run()).toEqual(true);
});

test('1 worker should treat a 2 message in right order', async (done) => {
    const completed = [];
    const mqMgr = new MessageQueueManager();
    const queue1 = await mqMgr.createQueue<MyItem>('queue1');
    mqMgr.addWorker<MyItem>(
        'queue1',
        async (item, instanceIdentifier) => {
            completed.push(item.payload.num);

            if (completed.length == 2 && completed[0] == 1 && completed[1] == 2) done();
        },
        1
    );
    queue1.enqueue({ num: 1, str: 'q1' });
    queue1.enqueue({ num: 2, str: 'q1' });
});
