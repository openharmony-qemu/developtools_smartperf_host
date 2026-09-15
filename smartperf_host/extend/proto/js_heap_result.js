/*eslint-disable block-scoped-var, id-length, no-control-regex, no-magic-numbers, no-prototype-builtins, no-redeclare, no-shadow, no-var, sort-vars*/
'use strict';

const $protobuf = require('protobufjs/minimal');

// Common aliases
const $Reader = $protobuf.Reader;
const $Writer = $protobuf.Writer;
const $util = $protobuf.util;

// Exported root namespace
let $root = $protobuf.roots.default || ($protobuf.roots.default = {});

$root.ArkTSResult = (function() {

    /**
     * Properties of an ArkTSResult.
     * @exports IArkTSResult
     * @interface IArkTSResult
     * @property {Uint8Array|null} [result] ArkTSResult result
     */

    /**
     * Constructs a new ArkTSResult.
     * @exports ArkTSResult
     * @classdesc Represents an ArkTSResult.
     * @implements IArkTSResult
     * @constructor
     * @param {IArkTSResult=} [properties] Properties to set
     */
    function ArkTSResult(properties) {
        if (properties) {
            for (let keys = Object.keys(properties), i = 0; i < keys.length; ++i) {
                if (properties[keys[i]] != null) {
                    this[keys[i]] = properties[keys[i]];
                }
            }
        }
    }

    /**
     * ArkTSResult result.
     * @member {Uint8Array} result
     * @memberof ArkTSResult
     * @instance
     */
    ArkTSResult.prototype.result = $util.newBuffer([]);

    /**
     * Creates a new ArkTSResult instance using the specified properties.
     * @function create
     * @memberof ArkTSResult
     * @static
     * @param {IArkTSResult=} [properties] Properties to set
     * @returns {ArkTSResult} ArkTSResult instance
     */
    ArkTSResult.create = function create(properties) {
        return new ArkTSResult(properties);
    };

    /**
     * Encodes the specified ArkTSResult message. Does not implicitly {@link ArkTSResult.verify|verify} messages.
     * @function encode
     * @memberof ArkTSResult
     * @static
     * @param {IArkTSResult} message ArkTSResult message or plain object to encode
     * @param {$protobuf.Writer} [writer] Writer to encode to
     * @returns {$protobuf.Writer} Writer
     */
    ArkTSResult.encode = function encode(message, writer) {
        if (!writer) {
            writer = $Writer.create();
        }
        if (message.result != null && Object.hasOwnProperty.call(message, 'result')) {
            writer.uint32(/* id 1, wireType 2 =*/10).bytes(message.result);
        }
        return writer;
    };

    /**
     * Encodes the specified ArkTSResult message, length delimited. Does not implicitly {@link ArkTSResult.verify|verify} messages.
     * @function encodeDelimited
     * @memberof ArkTSResult
     * @static
     * @param {IArkTSResult} message ArkTSResult message or plain object to encode
     * @param {$protobuf.Writer} [writer] Writer to encode to
     * @returns {$protobuf.Writer} Writer
     */
    ArkTSResult.encodeDelimited = function encodeDelimited(message, writer) {
        return this.encode(message, writer).ldelim();
    };

    /**
     * Decodes an ArkTSResult message from the specified reader or buffer.
     * @function decode
     * @memberof ArkTSResult
     * @static
     * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
     * @param {number} [length] Message length if known beforehand
     * @returns {ArkTSResult} ArkTSResult
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    ArkTSResult.decode = function decode(reader, length) {
        if (!(reader instanceof $Reader)) {
            reader = $Reader.create(reader);
        }
        let end = length === undefined ? reader.len : reader.pos + length;
        let message = new $root.ArkTSResult();
        while (reader.pos < end) {
            let tag = reader.uint32();
            switch (tag >>> 3) {
            case 1: {
                    message.result = reader.bytes();
                    break;
                }
            default:
                reader.skipType(tag & 7);
                break;
            }
        }
        return message;
    };

    /**
     * Decodes an ArkTSResult message from the specified reader or buffer, length delimited.
     * @function decodeDelimited
     * @memberof ArkTSResult
     * @static
     * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
     * @returns {ArkTSResult} ArkTSResult
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    ArkTSResult.decodeDelimited = function decodeDelimited(reader) {
        if (!(reader instanceof $Reader)) {
            reader = new $Reader(reader);
        }
        return this.decode(reader, reader.uint32());
    };

    /**
     * Verifies an ArkTSResult message.
     * @function verify
     * @memberof ArkTSResult
     * @static
     * @param {Object.<string,*>} message Plain object to verify
     * @returns {string|null} `null` if valid, otherwise the reason why it is not
     */
    ArkTSResult.verify = function verify(message) {
        if (typeof message !== 'object' || message === null) {
            return 'object expected';
        }
        if (message.result != null && Object.prototype.hasOwnProperty.call(message, 'result')) {
            if (!(message.result && typeof message.result.length === 'number' || $util.isString(message.result))) {
                return 'result: buffer expected';
            }
        }
        return null;
    };

    /**
     * Creates an ArkTSResult message from a plain object. Also converts values to their respective internal types.
     * @function fromObject
     * @memberof ArkTSResult
     * @static
     * @param {Object.<string,*>} object Plain object
     * @returns {ArkTSResult} ArkTSResult
     */
    ArkTSResult.fromObject = function fromObject(object) {
        if (object instanceof $root.ArkTSResult) {
            return object;
        }
        let message = new $root.ArkTSResult();
        if (object.result != null) {
            if (typeof object.result === 'string') {
                $util.base64.decode(object.result, message.result = $util.newBuffer($util.base64.length(object.result)), 0);
            } else if (object.result.length >= 0) {
                message.result = object.result;
            }
        }
        return message;
    };

    /**
     * Creates a plain object from an ArkTSResult message. Also converts values to other types if specified.
     * @function toObject
     * @memberof ArkTSResult
     * @static
     * @param {ArkTSResult} message ArkTSResult
     * @param {$protobuf.IConversionOptions} [options] Conversion options
     * @returns {Object.<string,*>} Plain object
     */
    ArkTSResult.toObject = function toObject(message, options) {
        if (!options) {
            options = {};
        }
        let object = {};
        if (options.defaults) {
            if (options.bytes === String) {
                object.result = '';
            } else {
                object.result = [];
                if (options.bytes !== Array) {
                    object.result = $util.newBuffer(object.result);
                }
            }
        }
        if (message.result != null && Object.prototype.hasOwnProperty.call(message, 'result')) {
            object.result = options.bytes === String
                ? $util.base64.encode(message.result, 0, message.result.length)
                : options.bytes === Array
                    ? Array.prototype.slice.call(message.result)
                    : message.result;
        }
        return object;
    };

    /**
     * Converts this ArkTSResult to JSON.
     * @function toJSON
     * @memberof ArkTSResult
     * @instance
     * @returns {Object.<string,*>} JSON object
     */
    ArkTSResult.prototype.toJSON = function toJSON() {
        return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
    };

    /**
     * Gets the default type url for ArkTSResult
     * @function getTypeUrl
     * @memberof ArkTSResult
     * @static
     * @param {string} [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
     * @returns {string} The default type url
     */
    ArkTSResult.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
        if (typeUrlPrefix === undefined) {
            typeUrlPrefix = 'type.googleapis.com';
        }
        return typeUrlPrefix + '/ArkTSResult';
    };

    return ArkTSResult;
})();

module.exports = $root;
