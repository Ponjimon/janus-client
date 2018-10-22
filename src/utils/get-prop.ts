export function getProp(
    obj: object,
    props: string | string[],
    defaultValue: any
): any {
    const newProps = Array.isArray(props)
        ? props
        : props.split('.').filter(i => i.length);
    // If we have reached an undefined/null property
    // then stop executing and return the default value.
    // If no default was provided it will be undefined.
    if (obj === undefined || obj === null) {
        return defaultValue;
    }

    // If the path array has no more elements, we've reached
    // the intended property and return its value
    if (newProps.length === 0) {
        return obj;
    }

    // Prepare our found property and path array for recursion
    const foundSoFar = obj[newProps[0]];
    const remainingProps = newProps.slice(1);

    return getProp(foundSoFar, remainingProps, defaultValue);
}
