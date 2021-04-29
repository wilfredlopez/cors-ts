import type { IncomingHttpHeaders } from 'http'

type StaticOrigin = boolean | string | RegExp | (string | RegExp)[]

type CustomOrigin = (requestOrigin: string | undefined, callback: (err: Error | null, origin?: StaticOrigin) => void) => void

interface CorsRequest {
    method?: string
    headers: IncomingHttpHeaders
}

export interface CorsOptions {
    /**
     * @default '*''
     */
    origin?: StaticOrigin | CustomOrigin
    /**
     * @default 'GET,HEAD,PUT,PATCH,POST,DELETE'
     */
    methods?: string | string[]
    allowedHeaders?: string | string[]
    exposedHeaders?: string | string[]
    credentials?: boolean
    maxAge?: number
    /**
     * @default false
     */
    preflightContinue?: boolean
    /**
     * @default 204
     */
    optionsSuccessStatus?: number
}
type CorsOptionsDelegate<T extends CorsRequest = CorsRequest> = (
    req: T,
    callback: (err: Error | null, options?: CorsOptions) => void,
) => void


interface CorsRes {
    statusCode?: number
    setHeader(key: string, value: string): any
    end(): any
}

type CorsNextFunc = (err?: any) => any

export default function cors<T extends CorsRequest = CorsRequest, Res extends CorsRes = CorsRes, Next extends CorsNextFunc = CorsNextFunc>(options: CorsOptions | CorsOptionsDelegate<T> | undefined = {}): (
    req: T,
    res: Res,
    next: Next
) => void {

    const assign = require('object-assign')
    const vary = require('vary')

    const defaults = {
        origin: '*',
        methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
        preflightContinue: false,
        optionsSuccessStatus: 204
    }

    function isString(s: any): s is string {
        return typeof s === 'string' || s instanceof String
    }






    function isOriginAllowed(origin: string, allowedOrigin: CorsOptions['origin']) {
        if (Array.isArray(allowedOrigin)) {
            for (var i = 0; i < allowedOrigin.length; ++i) {
                if (isOriginAllowed(origin, allowedOrigin[i])) {
                    return true
                }
            }
            return false
        } else if (isString(allowedOrigin)) {
            return origin === allowedOrigin
        } else if (allowedOrigin instanceof RegExp) {
            return allowedOrigin.test(origin)
        } else {
            return !!allowedOrigin
        }
    }




    function configureOrigin(options: CorsOptions, req: T) {
        var requestOrigin = req.headers.origin,
            headers: IncomingHttpHeaders[][] = [],
            isAllowed: boolean

        if (!options.origin || options.origin === '*') {
            // allow any origin
            headers.push([{
                key: 'Access-Control-Allow-Origin',
                value: '*'
            }])
        } else if (isString(options.origin)) {
            // fixed origin
            headers.push([{
                key: 'Access-Control-Allow-Origin',
                value: options.origin
            }])
            headers.push([{
                key: 'Vary',
                value: 'Origin'
            }])
        } else {
            isAllowed = isOriginAllowed(requestOrigin!, options.origin)
            // reflect origin
            headers.push([{
                key: 'Access-Control-Allow-Origin',
                // value: isAllowed ? requestOrigin : false
                value: isAllowed ? requestOrigin : undefined
            }])
            headers.push([{
                key: 'Vary',
                value: 'Origin'
            }])
        }

        return headers
    }

    function configureMethods(options: CorsOptions, _req: T) {
        var methods = options.methods
        if (Array.isArray(options.methods)) {
            methods = options.methods.join(',') // .methods is an array, so turn it into a string
        }
        return {
            key: 'Access-Control-Allow-Methods',
            value: methods
        }
    }

    function configureCredentials(options: CorsOptions, _req: T) {
        if (options.credentials === true) {
            return {
                key: 'Access-Control-Allow-Credentials',
                value: 'true'
            }
        }
        return null
    }

    function configureAllowedHeaders(options: CorsOptions & { headers?: CorsOptions['allowedHeaders'] }, req: T) {
        var allowedHeaders = options.allowedHeaders || options.headers
        var headers = []



        if (!allowedHeaders) {
            allowedHeaders = req.headers['access-control-request-headers'] // .headers wasn't specified, so reflect the request headers
            headers.push([{
                key: 'Vary',
                value: 'Access-Control-Request-Headers'
            }])
        } else if (Array.isArray(allowedHeaders)) {
            allowedHeaders = allowedHeaders.join(',') // .headers is an array, so turn it into a string
        }
        if (allowedHeaders && allowedHeaders.length) {
            headers.push([{
                key: 'Access-Control-Allow-Headers',
                value: allowedHeaders
            }])
        }

        return headers
    }

    function configureExposedHeaders(options: CorsOptions, _req: T) {
        var headers = options.exposedHeaders
        if (!headers) {
            return null
        } else if (Array.isArray(headers)) {
            headers = headers.join(',') // .headers is an array, so turn it into a string
        }
        if (headers && headers.length) {
            return {
                key: 'Access-Control-Expose-Headers',
                value: headers
            }
        }
        return null
    }

    function configureMaxAge(options: CorsOptions, _req: T) {
        var maxAge = (typeof options.maxAge === 'number' || options.maxAge) && options.maxAge.toString()
        if (maxAge && maxAge.length) {
            return {
                key: 'Access-Control-Max-Age',
                value: maxAge
            }
        }
        return null
    }




    function applyHeaders(headers: any[], res: Res) {
        for (var i = 0, n = headers.length; i < n; i++) {
            var header = headers[i]
            if (header) {
                if (Array.isArray(header)) {
                    applyHeaders(header, res)
                } else if (header.key === 'Vary' && header.value) {
                    vary(res, header.value)
                } else if (header.value) {
                    res.setHeader(header.key as string, header.value as string)
                }
            }
        }
    }

    function corsTs(options: CorsOptions, req: T, res: Res, next: Next) {
        var headers = [],
            method = req.method && req.method.toUpperCase && req.method.toUpperCase()

        if (method === 'OPTIONS') {
            // preflight
            headers.push(configureOrigin(options, req))
            headers.push(configureCredentials(options, req))
            headers.push(configureMethods(options, req))
            headers.push(configureAllowedHeaders(options, req))
            headers.push(configureMaxAge(options, req))
            headers.push(configureExposedHeaders(options, req))
            applyHeaders(headers, res)

            if (options.preflightContinue) {
                next()
            } else {
                // Safari (and potentially other browsers) need content-length 0,
                //   for 204 or they just hang waiting for a body
                res.statusCode = options.optionsSuccessStatus
                res.setHeader('Content-Length', '0')
                res.end()
            }
        } else {
            // actual response
            headers.push(configureOrigin(options, req))
            headers.push(configureCredentials(options, req))
            headers.push(configureExposedHeaders(options, req))
            applyHeaders(headers, res)
            next()
        }
    }

    function middlewareWrapper(o: CorsOptions | CorsOptionsDelegate<T>) {
        // if options are static (either via defaults or custom options passed in), wrap in a function
        var optionsCallback: CorsOptionsDelegate<T>
        if (typeof o === 'function') {
            optionsCallback = o
        } else {
            optionsCallback = function (_req, cb) {
                cb(null, o)
            }
        }

        return function corsMiddleware(req: T, res: Res, next: Next) {
            optionsCallback(req, function (err, options) {
                if (err) {
                    next(err)
                } else {
                    var corsOptions = assign({}, defaults, options)
                    var originCallback = null
                    if (corsOptions.origin && typeof corsOptions.origin === 'function') {
                        originCallback = corsOptions.origin
                    } else if (corsOptions.origin) {
                        originCallback = function (_origin: CorsOptions['origin'], cb: (err: Error | null, or: CorsOptions['origin']) => void) {
                            cb(null, corsOptions.origin)
                        }
                    }

                    if (originCallback) {
                        originCallback(req.headers.origin, function (err2: Error | null, origin: CorsOptions['origin']) {
                            if (err2 || !origin) {
                                next(err2)
                            } else {
                                corsOptions.origin = origin
                                corsTs(corsOptions, req, res, next)
                            }
                        })
                    } else {
                        next()
                    }
                }
            })
        }
    }
    return middlewareWrapper(options)
}


