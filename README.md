# ⛩ Dojo-SDK

<p align="center">
  <img src="https://user-images.githubusercontent.com/246724/146676294-43f321de-5702-490c-9608-35e03bc3ff91.png">
</p>

<p align="center">
  <img width="100%" src="https://i.makeagif.com/media/6-13-2016/PK2BlI.gif">
</p>


# Introduction:
⛩ Dojo-SDK is a framework that provides components simulating contracts and behaviors of real-world system components like database, auto-scaled services, message queues, etc.  
Inspired from [Dojo halls](https://en.wikipedia.org/wiki/Dojo), where participants are using dummies as [Wing Chun Dummy (Mu ren zhuang)](https://en.wikipedia.org/wiki/Mu_ren_zhuang) to learn and practice before going to real world.  
With Dojo-SDK you can practice real-world and a complete system designs & concepts. It is designed to be deterministic and re-playable so you could test your concepts with unit-tests tools and verify your concepts end to end.  
With a few commands on a single [`'matrix'`](#examples) handler you can spawn local DB, messages queue, micro-service & orchestrator, scheduler and more.  
See in [Dojo-Recipes](https://github.com/Livshitz/Dojo-Recipes)'s repo a list of  system-design challenges in which you can practice and implement using Dojo-SDK.  
This is essentially a system-wide playground you can play with from within your command line or even [run within your browser](https://raw.githack.com/Livshitz/dojo-sdk/master/src/examples/forBrowser.html) 🤯.

## Features:
1. ⭐️ **Database**: CRUD and query operations with multiple persistency options, memory and disk. Stores the data on a local JSON file so you can see in real time changes and actually intercept and change values directly and alter the running DB.
1. ⭐️ **MessageQueue**: Complete working stripped down messaging queue Provider and Consumer so you could implement easily your own consumer. Supports auto scaling to simulate real world behavior.
1. ⭐️ **Micro Services & Orchestrator**: HTTP micro services that can auto-scale based on traffic to simulate real-world orchestrated environment.
1. **Matrix**: Handy root level object that consolidates all needed methods to spawn your environment, instead of manually creating objects. Inspired by the jQuery 'jQuery master' object.
1. **Scheduler**: CRON scheduler to simulate scheduled jobs.
1. **Browser compatible**: Setup your simulated environment within the browser and play with it!
1. **Future**:
    1. **StreamProcessor (Kafka-like simulator)**: Simulate complex environments that include event streaming and events bus.
    1. **SqlDatabase**: Current Database implementation is NoSql in mind, in the future will better support SQL behavior database.


## Examples:

Check [src/examples/matrix.ts](/src/examples/matrix.ts) or [browser version (play with it!)](https://raw.githack.com/Livshitz/dojo-sdk/master/src/examples/forBrowser.html)
```typescript
const matrix = new Matrix();

// spawn DB with local disk persistency (will listen to local/external changes):
await matrix.addDB(new DiskPersistencyManager('./.tmp/db.json', true), {
	col: {
		'618230709af3ade104bee1ff': {
			a: 100,
			_id: '618230709af3ade104bee1ff',
		},
	},
});

// spawn MessageQueue service and a consumer:
await matrix.addMQ('queue1', { treat: (item) => console.log('This is my consumer treating item: ', item) });

// spawn a scheduler that will run every 5 seconds:
matrix.addScheduler(
	'*/5 * * * * *',
	() => {
		log.i('Scheduler: TICK!', faker.random.words(10));
	},
	SchedulerTypes.Recurring
);

// spawn a micro-service with auto-scaling from min 1 to max 10:
await matrix.addService(
	'/my-resource',
	() =>
		new (class extends BaseService {
			async handle(req: IRequest, res: IResponse) {
                console.log('Service:', req);
                res.type = ResponseTypes.OK;
                res.body = `You got it!`;
                return res;
            }
		})(),
	1,
	10
);

// perform actual call to the microservice 
await matrix.request(new RequestX('/my-resource', RequestMethods.GET));
```

## Recipes:
Go to [Dojo-Recipes](https://github.com/Livshitz/Dojo-Recipes) to start on with suggested scenarios to utilize dojo-sdk and solve them.


## Install:
```
$ yarn add dojo-sdk
or
$ npm install --save dojo-sdk   
```

## Develop:

### Build:

> `$ yarn build`

### Watch & Build:

> `$ yarn watch`

### Run tests:

> `$ yarn test <optional: path-to-test-file>`

### Debug:

> ` Select 'typescript' debug configuration, open file in vscode (to run it specifically) and run debugger`

or:

> ` Select 'Node Attach' debug configuration, run specific file in debug mode (you can pass also args):`

> `$ node --inspect build/Main.js`

## Use:

### Run:

Install this npm package


## Credits:
Logo SVG - Wing Chun by Icongeek26 from NounProject.com  
Dojo GIF - [makeagif.com](https://makeagif.com/gif/the-matrix-1999-kung-fu-dojo-fight-full-1080p-hd-PK2BlI)

---

Scaffolded with [🏗 TS-scaffold](https://github.com/Livshitz/ts-scaffold.git) 
