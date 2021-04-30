
const getOwnPropertySymbols = Object.getOwnPropertySymbols
const hasOwnProperty = Object.prototype.hasOwnProperty
const propIsEnumerable = Object.prototype.propertyIsEnumerable

function toObject(val: any) {
    if (val === null || val === undefined) {
        throw new TypeError('Object.assign cannot be called with null or undefined')
    }

    return Object(val)
}

function shouldUseNative() {
    try {
        if (!Object.assign) {
            return false
        }

        // Detect buggy property enumeration order in older V8 versions.

        var test1: any = new String('abc')
        test1[5] = 'de'
        if (Object.getOwnPropertyNames(test1)[0] === '5') {
            return false
        }

        var test2: Record<string, any> = {}
        for (var i = 0; i < 10; i++) {
            test2['_' + String.fromCharCode(i)] = i
        }
        var order2 = Object.getOwnPropertyNames(test2).map(function (n) {
            return test2[n]
        })
        if (order2.join('') !== '0123456789') {
            return false
        }

        // https://bugs.chromium.org/p/v8/issues/detail?id=3056
        var test3: Record<string, any> = {}
        'abcdefghijklmnopqrst'.split('').forEach(function (letter) {
            test3[letter] = letter
        })
        if (Object.keys(Object.assign({}, test3)).join('') !==
            'abcdefghijklmnopqrst') {
            return false
        }

        return true
    } catch (err) {
        // We don't expect any of the above to throw, but better to be safe.
        return false
    }
}

const _assign: typeof Object.assign = function <T, U>(target: T, source: U) {
    var from
    var to = toObject(target)
    var symbols

    for (var s = 1; s < arguments.length; s++) {
        from = Object(arguments[s])

        for (var key in from) {
            if (hasOwnProperty.call(from, key)) {
                to[key] = from[key]
            }
        }

        if (getOwnPropertySymbols) {
            symbols = getOwnPropertySymbols(from)
            for (var i = 0; i < symbols.length; i++) {
                if (propIsEnumerable.call(from, symbols[i])) {
                    to[symbols[i]] = from[symbols[i]]
                }
            }
        }
    }

    return to
}

const assign = shouldUseNative() ? Object.assign : _assign


export default assign