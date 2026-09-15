/*eslint-disable block-scoped-var, id-length, no-control-regex, no-magic-numbers, no-prototype-builtins, no-redeclare, no-shadow, no-var, sort-vars*/
"use strict";

var $protobuf = require("protobufjs/minimal");

// Common aliases
var $Reader = $protobuf.Reader, $Writer = $protobuf.Writer, $util = $protobuf.util;

// Exported root namespace
var $root = $protobuf.roots["default"] || ($protobuf.roots["default"] = {});

$root.ArkTSConfig = (function() {

    /**
     * Properties of an ArkTSConfig.
     * @exports IArkTSConfig
     * @interface IArkTSConfig
     * @property {number|null} [pid] ArkTSConfig pid
     * @property {ArkTSConfig.HeapType|null} [type] ArkTSConfig type
     * @property {number|null} [interval] ArkTSConfig interval
     * @property {boolean|null} [captureNumericValue] ArkTSConfig captureNumericValue
     * @property {boolean|null} [trackAllocations] ArkTSConfig trackAllocations
     * @property {boolean|null} [enableCpuProfiler] ArkTSConfig enableCpuProfiler
     * @property {number|null} [cpuProfilerInterval] ArkTSConfig cpuProfilerInterval
     */

    /**
     * Constructs a new ArkTSConfig.
     * @exports ArkTSConfig
     * @classdesc Represents an ArkTSConfig.
     * @implements IArkTSConfig
     * @constructor
     * @param {IArkTSConfig=} [properties] Properties to set
     */
    function ArkTSConfig(properties) {
        if (properties)
            for (var keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                if (properties[keys[i]] != null)
                    this[keys[i]] = properties[keys[i]];
    }

    /**
     * ArkTSConfig pid.
     * @member {number} pid
     * @memberof ArkTSConfig
     * @instance
     */
    ArkTSConfig.prototype.pid = 0;

    /**
     * ArkTSConfig type.
     * @member {ArkTSConfig.HeapType} type
     * @memberof ArkTSConfig
     * @instance
     */
    ArkTSConfig.prototype.type = 0;

    /**
     * ArkTSConfig interval.
     * @member {number} interval
     * @memberof ArkTSConfig
     * @instance
     */
    ArkTSConfig.prototype.interval = 0;

    /**
     * ArkTSConfig captureNumericValue.
     * @member {boolean} captureNumericValue
     * @memberof ArkTSConfig
     * @instance
     */
    ArkTSConfig.prototype.captureNumericValue = false;

    /**
     * ArkTSConfig trackAllocations.
     * @member {boolean} trackAllocations
     * @memberof ArkTSConfig
     * @instance
     */
    ArkTSConfig.prototype.trackAllocations = false;

    /**
     * ArkTSConfig enableCpuProfiler.
     * @member {boolean} enableCpuProfiler
     * @memberof ArkTSConfig
     * @instance
     */
    ArkTSConfig.prototype.enableCpuProfiler = false;

    /**
     * ArkTSConfig cpuProfilerInterval.
     * @member {number} cpuProfilerInterval
     * @memberof ArkTSConfig
     * @instance
     */
    ArkTSConfig.prototype.cpuProfilerInterval = 0;

    /**
     * Creates a new ArkTSConfig instance using the specified properties.
     * @function create
     * @memberof ArkTSConfig
     * @static
     * @param {IArkTSConfig=} [properties] Properties to set
     * @returns {ArkTSConfig} ArkTSConfig instance
     */
    ArkTSConfig.create = function create(properties) {
        return new ArkTSConfig(properties);
    };

    /**
     * Encodes the specified ArkTSConfig message. Does not implicitly {@link ArkTSConfig.verify|verify} messages.
     * @function encode
     * @memberof ArkTSConfig
     * @static
     * @param {IArkTSConfig} message ArkTSConfig message or plain object to encode
     * @param {$protobuf.Writer} [writer] Writer to encode to
     * @returns {$protobuf.Writer} Writer
     */
    ArkTSConfig.encode = function encode(message, writer) {
        if (!writer)
            writer = $Writer.create();
        if (message.pid != null && Object.hasOwnProperty.call(message, "pid"))
            writer.uint32(/* id 1, wireType 0 =*/8).int32(message.pid);
        if (message.type != null && Object.hasOwnProperty.call(message, "type"))
            writer.uint32(/* id 2, wireType 0 =*/16).int32(message.type);
        if (message.interval != null && Object.hasOwnProperty.call(message, "interval"))
            writer.uint32(/* id 3, wireType 0 =*/24).uint32(message.interval);
        if (message.captureNumericValue != null && Object.hasOwnProperty.call(message, "captureNumericValue"))
            writer.uint32(/* id 4, wireType 0 =*/32).bool(message.captureNumericValue);
        if (message.trackAllocations != null && Object.hasOwnProperty.call(message, "trackAllocations"))
            writer.uint32(/* id 5, wireType 0 =*/40).bool(message.trackAllocations);
        if (message.enableCpuProfiler != null && Object.hasOwnProperty.call(message, "enableCpuProfiler"))
            writer.uint32(/* id 6, wireType 0 =*/48).bool(message.enableCpuProfiler);
        if (message.cpuProfilerInterval != null && Object.hasOwnProperty.call(message, "cpuProfilerInterval"))
            writer.uint32(/* id 7, wireType 0 =*/56).uint32(message.cpuProfilerInterval);
        return writer;
    };

    /**
     * Encodes the specified ArkTSConfig message, length delimited. Does not implicitly {@link ArkTSConfig.verify|verify} messages.
     * @function encodeDelimited
     * @memberof ArkTSConfig
     * @static
     * @param {IArkTSConfig} message ArkTSConfig message or plain object to encode
     * @param {$protobuf.Writer} [writer] Writer to encode to
     * @returns {$protobuf.Writer} Writer
     */
    ArkTSConfig.encodeDelimited = function encodeDelimited(message, writer) {
        return this.encode(message, writer).ldelim();
    };

    /**
     * Decodes an ArkTSConfig message from the specified reader or buffer.
     * @function decode
     * @memberof ArkTSConfig
     * @static
     * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
     * @param {number} [length] Message length if known beforehand
     * @returns {ArkTSConfig} ArkTSConfig
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    ArkTSConfig.decode = function decode(reader, length) {
        if (!(reader instanceof $Reader))
            reader = $Reader.create(reader);
        var end = length === undefined ? reader.len : reader.pos + length, message = new $root.ArkTSConfig();
        while (reader.pos < end) {
            var tag = reader.uint32();
            switch (tag >>> 3) {
            case 1: {
                    message.pid = reader.int32();
                    break;
                }
            case 2: {
                    message.type = reader.int32();
                    break;
                }
            case 3: {
                    message.interval = reader.uint32();
                    break;
                }
            case 4: {
                    message.captureNumericValue = reader.bool();
                    break;
                }
            case 5: {
                    message.trackAllocations = reader.bool();
                    break;
                }
            case 6: {
                    message.enableCpuProfiler = reader.bool();
                    break;
                }
            case 7: {
                    message.cpuProfilerInterval = reader.uint32();
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
     * Decodes an ArkTSConfig message from the specified reader or buffer, length delimited.
     * @function decodeDelimited
     * @memberof ArkTSConfig
     * @static
     * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
     * @returns {ArkTSConfig} ArkTSConfig
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    ArkTSConfig.decodeDelimited = function decodeDelimited(reader) {
        if (!(reader instanceof $Reader))
            reader = new $Reader(reader);
        return this.decode(reader, reader.uint32());
    };

    /**
     * Verifies an ArkTSConfig message.
     * @function verify
     * @memberof ArkTSConfig
     * @static
     * @param {Object.<string,*>} message Plain object to verify
     * @returns {string|null} `null` if valid, otherwise the reason why it is not
     */
    ArkTSConfig.verify = function verify(message) {
        if (typeof message !== "object" || message === null)
            return "object expected";
        if (message.pid != null && message.hasOwnProperty("pid"))
            if (!$util.isInteger(message.pid))
                return "pid: integer expected";
        if (message.type != null && message.hasOwnProperty("type"))
            switch (message.type) {
            default:
                return "type: enum value expected";
            case 0:
            case 1:
            case -1:
                break;
            }
        if (message.interval != null && message.hasOwnProperty("interval"))
            if (!$util.isInteger(message.interval))
                return "interval: integer expected";
        if (message.captureNumericValue != null && message.hasOwnProperty("captureNumericValue"))
            if (typeof message.captureNumericValue !== "boolean")
                return "captureNumericValue: boolean expected";
        if (message.trackAllocations != null && message.hasOwnProperty("trackAllocations"))
            if (typeof message.trackAllocations !== "boolean")
                return "trackAllocations: boolean expected";
        if (message.enableCpuProfiler != null && message.hasOwnProperty("enableCpuProfiler"))
            if (typeof message.enableCpuProfiler !== "boolean")
                return "enableCpuProfiler: boolean expected";
        if (message.cpuProfilerInterval != null && message.hasOwnProperty("cpuProfilerInterval"))
            if (!$util.isInteger(message.cpuProfilerInterval))
                return "cpuProfilerInterval: integer expected";
        return null;
    };

    /**
     * Creates an ArkTSConfig message from a plain object. Also converts values to their respective internal types.
     * @function fromObject
     * @memberof ArkTSConfig
     * @static
     * @param {Object.<string,*>} object Plain object
     * @returns {ArkTSConfig} ArkTSConfig
     */
    ArkTSConfig.fromObject = function fromObject(object) {
        if (object instanceof $root.ArkTSConfig)
            return object;
        var message = new $root.ArkTSConfig();
        if (object.pid != null)
            message.pid = object.pid | 0;
        switch (object.type) {
        default:
            if (typeof object.type === "number") {
                message.type = object.type;
                break;
            }
            break;
        case "SNAPSHOT":
        case 0:
            message.type = 0;
            break;
        case "TIMELINE":
        case 1:
            message.type = 1;
            break;
        case "INVALID":
        case -1:
            message.type = -1;
            break;
        }
        if (object.interval != null)
            message.interval = object.interval >>> 0;
        if (object.captureNumericValue != null)
            message.captureNumericValue = Boolean(object.captureNumericValue);
        if (object.trackAllocations != null)
            message.trackAllocations = Boolean(object.trackAllocations);
        if (object.enableCpuProfiler != null)
            message.enableCpuProfiler = Boolean(object.enableCpuProfiler);
        if (object.cpuProfilerInterval != null)
            message.cpuProfilerInterval = object.cpuProfilerInterval >>> 0;
        return message;
    };

    /**
     * Creates a plain object from an ArkTSConfig message. Also converts values to other types if specified.
     * @function toObject
     * @memberof ArkTSConfig
     * @static
     * @param {ArkTSConfig} message ArkTSConfig
     * @param {$protobuf.IConversionOptions} [options] Conversion options
     * @returns {Object.<string,*>} Plain object
     */
    ArkTSConfig.toObject = function toObject(message, options) {
        if (!options)
            options = {};
        var object = {};
        if (options.defaults) {
            object.pid = 0;
            object.type = options.enums === String ? "SNAPSHOT" : 0;
            object.interval = 0;
            object.captureNumericValue = false;
            object.trackAllocations = false;
            object.enableCpuProfiler = false;
            object.cpuProfilerInterval = 0;
        }
        if (message.pid != null && message.hasOwnProperty("pid"))
            object.pid = message.pid;
        if (message.type != null && message.hasOwnProperty("type"))
            object.type = options.enums === String ? $root.ArkTSConfig.HeapType[message.type] === undefined ? message.type : $root.ArkTSConfig.HeapType[message.type] : message.type;
        if (message.interval != null && message.hasOwnProperty("interval"))
            object.interval = message.interval;
        if (message.captureNumericValue != null && message.hasOwnProperty("captureNumericValue"))
            object.captureNumericValue = message.captureNumericValue;
        if (message.trackAllocations != null && message.hasOwnProperty("trackAllocations"))
            object.trackAllocations = message.trackAllocations;
        if (message.enableCpuProfiler != null && message.hasOwnProperty("enableCpuProfiler"))
            object.enableCpuProfiler = message.enableCpuProfiler;
        if (message.cpuProfilerInterval != null && message.hasOwnProperty("cpuProfilerInterval"))
            object.cpuProfilerInterval = message.cpuProfilerInterval;
        return object;
    };

    /**
     * Converts this ArkTSConfig to JSON.
     * @function toJSON
     * @memberof ArkTSConfig
     * @instance
     * @returns {Object.<string,*>} JSON object
     */
    ArkTSConfig.prototype.toJSON = function toJSON() {
        return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
    };

    /**
     * Gets the default type url for ArkTSConfig
     * @function getTypeUrl
     * @memberof ArkTSConfig
     * @static
     * @param {string} [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
     * @returns {string} The default type url
     */
    ArkTSConfig.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
        if (typeUrlPrefix === undefined) {
            typeUrlPrefix = "type.googleapis.com";
        }
        return typeUrlPrefix + "/ArkTSConfig";
    };

    /**
     * HeapType enum.
     * @name ArkTSConfig.HeapType
     * @enum {number}
     * @property {number} SNAPSHOT=0 SNAPSHOT value
     * @property {number} TIMELINE=1 TIMELINE value
     * @property {number} INVALID=-1 INVALID value
     */
    ArkTSConfig.HeapType = (function() {
        var valuesById = {}, values = Object.create(valuesById);
        values[valuesById[0] = "SNAPSHOT"] = 0;
        values[valuesById[1] = "TIMELINE"] = 1;
        values[valuesById[-1] = "INVALID"] = -1;
        return values;
    })();

    return ArkTSConfig;
})();

module.exports = $root;
