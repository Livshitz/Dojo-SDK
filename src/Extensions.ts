declare interface String {
    replaceAt(index: number, replacement: string): string;
}

String.prototype.replaceAt = function (index, replacement) {
    return this.substring(0, index) + replacement + this.substring(index + replacement.length);
};
