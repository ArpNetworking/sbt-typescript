class ClassWithDecorator {
    @decorator
    testMethod(arg: string) {
        return undefined;
    }
}

function decorator(target: Object, propertyKey: string, descriptor: TypedPropertyDescriptor<any>) {
    return descriptor;
}
