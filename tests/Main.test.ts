import App from '../src/Main';

test.skip('should return true', async (done) => {
    const main = new App();
    expect(main.run()).toEqual(true);
});
