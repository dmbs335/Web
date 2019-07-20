class Random {
    constructor(seed1, seed2) {
        this.maxValue = 0x3FFFFFFF;
        this.seed1 = seed1 % this.maxValue;
        this.seed2 = seed2 % this.maxValue;
    }
}

class ItemFuncRand {
    constructor(arg, limit=10) {
        this.seedRandom(arg);
        this.limit = limit;
    }
    seedRandom(arg) {
        this.randSt = new Random(arg * 0x10001 + 55555555, arg * 0x10000001);
        this.arg = arg;
    }
    *myRnd() {
        const randSt = this.randSt;
        for(let i=0; i < this.limit; i++) {
            randSt.seed1 = (randSt.seed1 * 3 + randSt.seed2) % randSt.maxValue;
            randSt.seed2 = (randSt.seed1 + randSt.seed2 + 33) % randSt.maxValue;
            yield randSt.seed1 / randSt.maxValue;
        }
    }
    generate() {
        const gen = this.myRnd();
        console.log("Generate mysql's rand(%d) value %d times", this.arg, this.limit);
        for(let value of gen) {
            console.log(value);
        }
    }
}
