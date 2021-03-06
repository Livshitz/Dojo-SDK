import { libx } from 'libx.js/build/bundles/essentials';
import { helpers } from 'libx.js/build/helpers';
import { Database } from './Database';

test('should do basic write, retrieve and find', async (done) => {
    const db = new Database({});
    await db.onReady;
    const col = 'myCollection';
    const id = await db.insert(col, {
        a: 1,
        b: 2,
    });
    const expected = { a: 1, b: 22, _id: id };
    expect(id?.length).toEqual(24);
    let update_obj = await db.update(col, id, { b: 22 });
    expect(update_obj).toEqual(expected);

    const res = await db.get(col, id);
    expect(res).toEqual(expected);

    const found = await db.find(col, (x) => x.b == 22);
    expect(found.length).toEqual(1);
    expect(found[0]).toEqual(expected);

    done();
});

test('should perform well with large dataset', async (done) => {
    // jest.setTimeout(30000);

    const db = new Database({});
    await db.onReady;
    const col = 'myCollection';
    const amount = 10000;
    libx.startMeasure('write_time');
    for (let i = 0; i <= amount; i++) {
        await db.insert(col, { a: 'hello world', i });
    }
    const dur_write = libx.peekMeasure('write_time');
    // console.log(dur_write);
    expect(dur_write).toBeLessThanOrEqual(1200);

    libx.startMeasure('find_time');
    const found = await db.find(col, (x) => x.i == amount);
    const dur_find = libx.peekMeasure('find_time');
    expect(found.length).toEqual(1);
    expect(dur_find).toBeLessThanOrEqual(1000);
    // console.log('dur: ', dur_find);
    done();
});
