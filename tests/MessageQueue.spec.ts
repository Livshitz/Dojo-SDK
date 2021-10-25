import { libx } from 'libx.js/build/bundles/node.essentials';
import { log } from 'libx.js/build/modules/log';
import { MessageQueueManager } from '../src/MessageQueue/MessageQueueManager';
import { Publisher } from '../src/MessageQueue/Publisher';

// libx.log.isDebug = true;

class MyItem {
    public str: string;
    public num: number;
}

const sleep = 5;

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
    const events = [];
    const checkCompleted = () => {
        if (events.join(';') == ['msg1 enqueue', 'msg2 enqueue', 'msg3 enqueue', 'msg1 treated', 'msg2 treated', 'msg3 treated'].join(';')) done();
    };

    const mqMgr = new MessageQueueManager();
    const queue1 = await mqMgr.createQueue<MyItem>('queue1');
    mqMgr.addWorker<MyItem>(
        'queue1',
        async (item, instanceIdentifier) => {
            await libx.sleep(sleep);
            events.push(item.payload.str + ' treated');
            checkCompleted();
        },
        1
    );
    queue1.enqueue({ num: 1, str: 'msg1' });
    events.push('msg1 enqueue');
    queue1.enqueue({ num: 2, str: 'msg2' });
    events.push('msg2 enqueue');
    queue1.enqueue({ num: 3, str: 'msg3' });
    events.push('msg3 enqueue');
});

test('1 worker with 2 instances should treat a 2 message in order and in parallel and another 1', async (done) => {
    const events = [];
    const checkCompleted = () => {
        // console.log(events);
        if (
            events.join(';') ==
            ['msg1 enqueue', 'msg2 enqueue', 'msg3 enqueue', 'msg1 treated by queue1:0', 'msg2 treated by queue1:1', 'msg3 treated by queue1:0'].join(';')
        ) {
            done();
        }
    };

    const mqMgr = new MessageQueueManager();
    const queue1 = await mqMgr.createQueue<MyItem>('queue1');
    mqMgr.addWorker<MyItem>(
        'queue1',
        async (item, instanceIdentifier) => {
            await libx.sleep(sleep);
            events.push(item.payload.str + ' treated by ' + instanceIdentifier.slice(0, -4));
            checkCompleted();
        },
        2
    );
    queue1.enqueue({ num: 1, str: 'msg1' });
    events.push('msg1 enqueue');
    await libx.sleep(0);
    queue1.enqueue({ num: 2, str: 'msg2' });
    events.push('msg2 enqueue');
    await libx.sleep(0);
    queue1.enqueue({ num: 3, str: 'msg3' });
    events.push('msg3 enqueue');
    await libx.sleep(0);
});

test('1 worker with 3 instances should treat a 3 message in order and in parallel', async (done) => {
    const events = [];
    const checkCompleted = () => {
        // console.log(events);
        if (
            events.join(';') ==
            ['msg1 enqueue', 'msg2 enqueue', 'msg3 enqueue', 'msg1 treated by queue1:0', 'msg2 treated by queue1:1', 'msg3 treated by queue1:2'].join(';')
        ) {
            done();
        }
    };

    const mqMgr = new MessageQueueManager();
    const queue1 = await mqMgr.createQueue<MyItem>('queue1');
    mqMgr.addWorker<MyItem>(
        'queue1',
        async (item, instanceIdentifier) => {
            await libx.sleep(sleep);
            events.push(item.payload.str + ' treated by ' + instanceIdentifier.slice(0, -4));
            checkCompleted();
        },
        3
    );
    queue1.enqueue({ num: 1, str: 'msg1' });
    events.push('msg1 enqueue');
    await libx.sleep(0);
    queue1.enqueue({ num: 2, str: 'msg2' });
    events.push('msg2 enqueue');
    await libx.sleep(0);
    queue1.enqueue({ num: 3, str: 'msg3' });
    events.push('msg3 enqueue');
    await libx.sleep(0);
});

test('2 worker with 1 instances should treat a 3 message in order and in sequence', async (done) => {
    const events = [];
    const checkCompleted = () => {
        // console.log(events);
        if (
            events.join(';') ==
            ['msg1 enqueue', 'msg2 enqueue', 'msg3 enqueue', 'msg1 treated by queue1:0', 'msg2 treated by queue2:0', 'msg3 treated by queue1:0'].join(';')
        ) {
            done();
        }
    };

    const mqMgr = new MessageQueueManager();
    const queue1 = await mqMgr.createQueue<MyItem>('queue1');
    const queue2 = await mqMgr.createQueue<MyItem>('queue2');
    const treat = async (item, instanceIdentifier) => {
        await libx.sleep(sleep);
        events.push(item.payload.str + ' treated by ' + instanceIdentifier.slice(0, -4));
        checkCompleted();
    };
    mqMgr.addWorker<MyItem>('queue1', treat, 1);
    mqMgr.addWorker<MyItem>('queue2', treat, 1);
    queue1.enqueue({ num: 1, str: 'msg1' });
    events.push('msg1 enqueue');
    await libx.sleep(0);
    queue2.enqueue({ num: 2, str: 'msg2' });
    events.push('msg2 enqueue');
    await libx.sleep(0);
    queue1.enqueue({ num: 3, str: 'msg3' });
    events.push('msg3 enqueue');
    await libx.sleep(0);
});
