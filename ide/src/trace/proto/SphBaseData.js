/*eslint-disable block-scoped-var, id-length, no-control-regex, no-magic-numbers, no-prototype-builtins, no-redeclare, no-shadow, no-var, sort-vars*/
"use strict";

var $protobuf = require("protobufjs/minimal");

// Common aliases
var $Reader = $protobuf.Reader, $Writer = $protobuf.Writer, $util = $protobuf.util;

// Exported root namespace
var $root = $protobuf.roots["default"] || ($protobuf.roots["default"] = {});

$root.SphCpuData = (function() {

    /**
     * Properties of a SphCpuData.
     * @exports ISphCpuData
     * @interface ISphCpuData
     * @property {number|null} [processId] SphCpuData processId
     * @property {number|null} [cpu] SphCpuData cpu
     * @property {number|null} [tid] SphCpuData tid
     * @property {number|null} [id] SphCpuData id
     * @property {number|Long|null} [dur] SphCpuData dur
     * @property {number|Long|null} [startTime] SphCpuData startTime
     */

    /**
     * Constructs a new SphCpuData.
     * @exports SphCpuData
     * @classdesc Represents a SphCpuData.
     * @implements ISphCpuData
     * @constructor
     * @param {ISphCpuData=} [properties] Properties to set
     */
    function SphCpuData(properties) {
        if (properties)
            for (var keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                if (properties[keys[i]] != null)
                    this[keys[i]] = properties[keys[i]];
    }

    /**
     * SphCpuData processId.
     * @member {number} processId
     * @memberof SphCpuData
     * @instance
     */
    SphCpuData.prototype.processId = 0;

    /**
     * SphCpuData cpu.
     * @member {number} cpu
     * @memberof SphCpuData
     * @instance
     */
    SphCpuData.prototype.cpu = 0;

    /**
     * SphCpuData tid.
     * @member {number} tid
     * @memberof SphCpuData
     * @instance
     */
    SphCpuData.prototype.tid = 0;

    /**
     * SphCpuData id.
     * @member {number} id
     * @memberof SphCpuData
     * @instance
     */
    SphCpuData.prototype.id = 0;

    /**
     * SphCpuData dur.
     * @member {number|Long} dur
     * @memberof SphCpuData
     * @instance
     */
    SphCpuData.prototype.dur = $util.Long ? $util.Long.fromBits(0,0,false) : 0;

    /**
     * SphCpuData startTime.
     * @member {number|Long} startTime
     * @memberof SphCpuData
     * @instance
     */
    SphCpuData.prototype.startTime = $util.Long ? $util.Long.fromBits(0,0,false) : 0;

    /**
     * Creates a new SphCpuData instance using the specified properties.
     * @function create
     * @memberof SphCpuData
     * @static
     * @param {ISphCpuData=} [properties] Properties to set
     * @returns {SphCpuData} SphCpuData instance
     */
    SphCpuData.create = function create(properties) {
        return new SphCpuData(properties);
    };

    /**
     * Encodes the specified SphCpuData message. Does not implicitly {@link SphCpuData.verify|verify} messages.
     * @function encode
     * @memberof SphCpuData
     * @static
     * @param {ISphCpuData} message SphCpuData message or plain object to encode
     * @param {$protobuf.Writer} [writer] Writer to encode to
     * @returns {$protobuf.Writer} Writer
     */
    SphCpuData.encode = function encode(message, writer) {
        if (!writer)
            writer = $Writer.create();
        if (message.processId != null && Object.hasOwnProperty.call(message, "processId"))
            writer.uint32(/* id 1, wireType 0 =*/8).int32(message.processId);
        if (message.cpu != null && Object.hasOwnProperty.call(message, "cpu"))
            writer.uint32(/* id 2, wireType 0 =*/16).int32(message.cpu);
        if (message.tid != null && Object.hasOwnProperty.call(message, "tid"))
            writer.uint32(/* id 3, wireType 0 =*/24).int32(message.tid);
        if (message.id != null && Object.hasOwnProperty.call(message, "id"))
            writer.uint32(/* id 4, wireType 0 =*/32).int32(message.id);
        if (message.dur != null && Object.hasOwnProperty.call(message, "dur"))
            writer.uint32(/* id 5, wireType 0 =*/40).int64(message.dur);
        if (message.startTime != null && Object.hasOwnProperty.call(message, "startTime"))
            writer.uint32(/* id 6, wireType 0 =*/48).int64(message.startTime);
        return writer;
    };

    /**
     * Encodes the specified SphCpuData message, length delimited. Does not implicitly {@link SphCpuData.verify|verify} messages.
     * @function encodeDelimited
     * @memberof SphCpuData
     * @static
     * @param {ISphCpuData} message SphCpuData message or plain object to encode
     * @param {$protobuf.Writer} [writer] Writer to encode to
     * @returns {$protobuf.Writer} Writer
     */
    SphCpuData.encodeDelimited = function encodeDelimited(message, writer) {
        return this.encode(message, writer).ldelim();
    };

    /**
     * Decodes a SphCpuData message from the specified reader or buffer.
     * @function decode
     * @memberof SphCpuData
     * @static
     * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
     * @param {number} [length] Message length if known beforehand
     * @returns {SphCpuData} SphCpuData
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    SphCpuData.decode = function decode(reader, length) {
        if (!(reader instanceof $Reader))
            reader = $Reader.create(reader);
        var end = length === undefined ? reader.len : reader.pos + length, message = new $root.SphCpuData();
        while (reader.pos < end) {
            var tag = reader.uint32();
            switch (tag >>> 3) {
            case 1: {
                    message.processId = reader.int32();
                    break;
                }
            case 2: {
                    message.cpu = reader.int32();
                    break;
                }
            case 3: {
                    message.tid = reader.int32();
                    break;
                }
            case 4: {
                    message.id = reader.int32();
                    break;
                }
            case 5: {
                    message.dur = reader.int64();
                    break;
                }
            case 6: {
                    message.startTime = reader.int64();
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
     * Decodes a SphCpuData message from the specified reader or buffer, length delimited.
     * @function decodeDelimited
     * @memberof SphCpuData
     * @static
     * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
     * @returns {SphCpuData} SphCpuData
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    SphCpuData.decodeDelimited = function decodeDelimited(reader) {
        if (!(reader instanceof $Reader))
            reader = new $Reader(reader);
        return this.decode(reader, reader.uint32());
    };

    /**
     * Verifies a SphCpuData message.
     * @function verify
     * @memberof SphCpuData
     * @static
     * @param {Object.<string,*>} message Plain object to verify
     * @returns {string|null} `null` if valid, otherwise the reason why it is not
     */
    SphCpuData.verify = function verify(message) {
        if (typeof message !== "object" || message === null)
            return "object expected";
        if (message.processId != null && message.hasOwnProperty("processId"))
            if (!$util.isInteger(message.processId))
                return "processId: integer expected";
        if (message.cpu != null && message.hasOwnProperty("cpu"))
            if (!$util.isInteger(message.cpu))
                return "cpu: integer expected";
        if (message.tid != null && message.hasOwnProperty("tid"))
            if (!$util.isInteger(message.tid))
                return "tid: integer expected";
        if (message.id != null && message.hasOwnProperty("id"))
            if (!$util.isInteger(message.id))
                return "id: integer expected";
        if (message.dur != null && message.hasOwnProperty("dur"))
            if (!$util.isInteger(message.dur) && !(message.dur && $util.isInteger(message.dur.low) && $util.isInteger(message.dur.high)))
                return "dur: integer|Long expected";
        if (message.startTime != null && message.hasOwnProperty("startTime"))
            if (!$util.isInteger(message.startTime) && !(message.startTime && $util.isInteger(message.startTime.low) && $util.isInteger(message.startTime.high)))
                return "startTime: integer|Long expected";
        return null;
    };

    /**
     * Creates a SphCpuData message from a plain object. Also converts values to their respective internal types.
     * @function fromObject
     * @memberof SphCpuData
     * @static
     * @param {Object.<string,*>} object Plain object
     * @returns {SphCpuData} SphCpuData
     */
    SphCpuData.fromObject = function fromObject(object) {
        if (object instanceof $root.SphCpuData)
            return object;
        var message = new $root.SphCpuData();
        if (object.processId != null)
            message.processId = object.processId | 0;
        if (object.cpu != null)
            message.cpu = object.cpu | 0;
        if (object.tid != null)
            message.tid = object.tid | 0;
        if (object.id != null)
            message.id = object.id | 0;
        if (object.dur != null)
            if ($util.Long)
                (message.dur = $util.Long.fromValue(object.dur)).unsigned = false;
            else if (typeof object.dur === "string")
                message.dur = parseInt(object.dur, 10);
            else if (typeof object.dur === "number")
                message.dur = object.dur;
            else if (typeof object.dur === "object")
                message.dur = new $util.LongBits(object.dur.low >>> 0, object.dur.high >>> 0).toNumber();
        if (object.startTime != null)
            if ($util.Long)
                (message.startTime = $util.Long.fromValue(object.startTime)).unsigned = false;
            else if (typeof object.startTime === "string")
                message.startTime = parseInt(object.startTime, 10);
            else if (typeof object.startTime === "number")
                message.startTime = object.startTime;
            else if (typeof object.startTime === "object")
                message.startTime = new $util.LongBits(object.startTime.low >>> 0, object.startTime.high >>> 0).toNumber();
        return message;
    };

    /**
     * Creates a plain object from a SphCpuData message. Also converts values to other types if specified.
     * @function toObject
     * @memberof SphCpuData
     * @static
     * @param {SphCpuData} message SphCpuData
     * @param {$protobuf.IConversionOptions} [options] Conversion options
     * @returns {Object.<string,*>} Plain object
     */
    SphCpuData.toObject = function toObject(message, options) {
        if (!options)
            options = {};
        var object = {};
        if (options.defaults) {
            object.processId = 0;
            object.cpu = 0;
            object.tid = 0;
            object.id = 0;
            if ($util.Long) {
                var long = new $util.Long(0, 0, false);
                object.dur = options.longs === String ? long.toString() : options.longs === Number ? long.toNumber() : long;
            } else
                object.dur = options.longs === String ? "0" : 0;
            if ($util.Long) {
                var long = new $util.Long(0, 0, false);
                object.startTime = options.longs === String ? long.toString() : options.longs === Number ? long.toNumber() : long;
            } else
                object.startTime = options.longs === String ? "0" : 0;
        }
        if (message.processId != null && message.hasOwnProperty("processId"))
            object.processId = message.processId;
        if (message.cpu != null && message.hasOwnProperty("cpu"))
            object.cpu = message.cpu;
        if (message.tid != null && message.hasOwnProperty("tid"))
            object.tid = message.tid;
        if (message.id != null && message.hasOwnProperty("id"))
            object.id = message.id;
        if (message.dur != null && message.hasOwnProperty("dur"))
            if (typeof message.dur === "number")
                object.dur = options.longs === String ? String(message.dur) : message.dur;
            else
                object.dur = options.longs === String ? $util.Long.prototype.toString.call(message.dur) : options.longs === Number ? new $util.LongBits(message.dur.low >>> 0, message.dur.high >>> 0).toNumber() : message.dur;
        if (message.startTime != null && message.hasOwnProperty("startTime"))
            if (typeof message.startTime === "number")
                object.startTime = options.longs === String ? String(message.startTime) : message.startTime;
            else
                object.startTime = options.longs === String ? $util.Long.prototype.toString.call(message.startTime) : options.longs === Number ? new $util.LongBits(message.startTime.low >>> 0, message.startTime.high >>> 0).toNumber() : message.startTime;
        return object;
    };

    /**
     * Converts this SphCpuData to JSON.
     * @function toJSON
     * @memberof SphCpuData
     * @instance
     * @returns {Object.<string,*>} JSON object
     */
    SphCpuData.prototype.toJSON = function toJSON() {
        return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
    };

    /**
     * Gets the default type url for SphCpuData
     * @function getTypeUrl
     * @memberof SphCpuData
     * @static
     * @param {string} [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
     * @returns {string} The default type url
     */
    SphCpuData.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
        if (typeUrlPrefix === undefined) {
            typeUrlPrefix = "type.googleapis.com";
        }
        return typeUrlPrefix + "/SphCpuData";
    };

    return SphCpuData;
})();

$root.SphCpuFreqData = (function() {

    /**
     * Properties of a SphCpuFreqData.
     * @exports ISphCpuFreqData
     * @interface ISphCpuFreqData
     * @property {number|null} [cpu] SphCpuFreqData cpu
     * @property {number|null} [value] SphCpuFreqData value
     * @property {number|Long|null} [dur] SphCpuFreqData dur
     * @property {number|Long|null} [startNs] SphCpuFreqData startNs
     */

    /**
     * Constructs a new SphCpuFreqData.
     * @exports SphCpuFreqData
     * @classdesc Represents a SphCpuFreqData.
     * @implements ISphCpuFreqData
     * @constructor
     * @param {ISphCpuFreqData=} [properties] Properties to set
     */
    function SphCpuFreqData(properties) {
        if (properties)
            for (var keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                if (properties[keys[i]] != null)
                    this[keys[i]] = properties[keys[i]];
    }

    /**
     * SphCpuFreqData cpu.
     * @member {number} cpu
     * @memberof SphCpuFreqData
     * @instance
     */
    SphCpuFreqData.prototype.cpu = 0;

    /**
     * SphCpuFreqData value.
     * @member {number} value
     * @memberof SphCpuFreqData
     * @instance
     */
    SphCpuFreqData.prototype.value = 0;

    /**
     * SphCpuFreqData dur.
     * @member {number|Long} dur
     * @memberof SphCpuFreqData
     * @instance
     */
    SphCpuFreqData.prototype.dur = $util.Long ? $util.Long.fromBits(0,0,false) : 0;

    /**
     * SphCpuFreqData startNs.
     * @member {number|Long} startNs
     * @memberof SphCpuFreqData
     * @instance
     */
    SphCpuFreqData.prototype.startNs = $util.Long ? $util.Long.fromBits(0,0,false) : 0;

    /**
     * Creates a new SphCpuFreqData instance using the specified properties.
     * @function create
     * @memberof SphCpuFreqData
     * @static
     * @param {ISphCpuFreqData=} [properties] Properties to set
     * @returns {SphCpuFreqData} SphCpuFreqData instance
     */
    SphCpuFreqData.create = function create(properties) {
        return new SphCpuFreqData(properties);
    };

    /**
     * Encodes the specified SphCpuFreqData message. Does not implicitly {@link SphCpuFreqData.verify|verify} messages.
     * @function encode
     * @memberof SphCpuFreqData
     * @static
     * @param {ISphCpuFreqData} message SphCpuFreqData message or plain object to encode
     * @param {$protobuf.Writer} [writer] Writer to encode to
     * @returns {$protobuf.Writer} Writer
     */
    SphCpuFreqData.encode = function encode(message, writer) {
        if (!writer)
            writer = $Writer.create();
        if (message.cpu != null && Object.hasOwnProperty.call(message, "cpu"))
            writer.uint32(/* id 1, wireType 0 =*/8).int32(message.cpu);
        if (message.value != null && Object.hasOwnProperty.call(message, "value"))
            writer.uint32(/* id 2, wireType 0 =*/16).int32(message.value);
        if (message.dur != null && Object.hasOwnProperty.call(message, "dur"))
            writer.uint32(/* id 3, wireType 0 =*/24).int64(message.dur);
        if (message.startNs != null && Object.hasOwnProperty.call(message, "startNs"))
            writer.uint32(/* id 4, wireType 0 =*/32).int64(message.startNs);
        return writer;
    };

    /**
     * Encodes the specified SphCpuFreqData message, length delimited. Does not implicitly {@link SphCpuFreqData.verify|verify} messages.
     * @function encodeDelimited
     * @memberof SphCpuFreqData
     * @static
     * @param {ISphCpuFreqData} message SphCpuFreqData message or plain object to encode
     * @param {$protobuf.Writer} [writer] Writer to encode to
     * @returns {$protobuf.Writer} Writer
     */
    SphCpuFreqData.encodeDelimited = function encodeDelimited(message, writer) {
        return this.encode(message, writer).ldelim();
    };

    /**
     * Decodes a SphCpuFreqData message from the specified reader or buffer.
     * @function decode
     * @memberof SphCpuFreqData
     * @static
     * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
     * @param {number} [length] Message length if known beforehand
     * @returns {SphCpuFreqData} SphCpuFreqData
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    SphCpuFreqData.decode = function decode(reader, length) {
        if (!(reader instanceof $Reader))
            reader = $Reader.create(reader);
        var end = length === undefined ? reader.len : reader.pos + length, message = new $root.SphCpuFreqData();
        while (reader.pos < end) {
            var tag = reader.uint32();
            switch (tag >>> 3) {
            case 1: {
                    message.cpu = reader.int32();
                    break;
                }
            case 2: {
                    message.value = reader.int32();
                    break;
                }
            case 3: {
                    message.dur = reader.int64();
                    break;
                }
            case 4: {
                    message.startNs = reader.int64();
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
     * Decodes a SphCpuFreqData message from the specified reader or buffer, length delimited.
     * @function decodeDelimited
     * @memberof SphCpuFreqData
     * @static
     * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
     * @returns {SphCpuFreqData} SphCpuFreqData
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    SphCpuFreqData.decodeDelimited = function decodeDelimited(reader) {
        if (!(reader instanceof $Reader))
            reader = new $Reader(reader);
        return this.decode(reader, reader.uint32());
    };

    /**
     * Verifies a SphCpuFreqData message.
     * @function verify
     * @memberof SphCpuFreqData
     * @static
     * @param {Object.<string,*>} message Plain object to verify
     * @returns {string|null} `null` if valid, otherwise the reason why it is not
     */
    SphCpuFreqData.verify = function verify(message) {
        if (typeof message !== "object" || message === null)
            return "object expected";
        if (message.cpu != null && message.hasOwnProperty("cpu"))
            if (!$util.isInteger(message.cpu))
                return "cpu: integer expected";
        if (message.value != null && message.hasOwnProperty("value"))
            if (!$util.isInteger(message.value))
                return "value: integer expected";
        if (message.dur != null && message.hasOwnProperty("dur"))
            if (!$util.isInteger(message.dur) && !(message.dur && $util.isInteger(message.dur.low) && $util.isInteger(message.dur.high)))
                return "dur: integer|Long expected";
        if (message.startNs != null && message.hasOwnProperty("startNs"))
            if (!$util.isInteger(message.startNs) && !(message.startNs && $util.isInteger(message.startNs.low) && $util.isInteger(message.startNs.high)))
                return "startNs: integer|Long expected";
        return null;
    };

    /**
     * Creates a SphCpuFreqData message from a plain object. Also converts values to their respective internal types.
     * @function fromObject
     * @memberof SphCpuFreqData
     * @static
     * @param {Object.<string,*>} object Plain object
     * @returns {SphCpuFreqData} SphCpuFreqData
     */
    SphCpuFreqData.fromObject = function fromObject(object) {
        if (object instanceof $root.SphCpuFreqData)
            return object;
        var message = new $root.SphCpuFreqData();
        if (object.cpu != null)
            message.cpu = object.cpu | 0;
        if (object.value != null)
            message.value = object.value | 0;
        if (object.dur != null)
            if ($util.Long)
                (message.dur = $util.Long.fromValue(object.dur)).unsigned = false;
            else if (typeof object.dur === "string")
                message.dur = parseInt(object.dur, 10);
            else if (typeof object.dur === "number")
                message.dur = object.dur;
            else if (typeof object.dur === "object")
                message.dur = new $util.LongBits(object.dur.low >>> 0, object.dur.high >>> 0).toNumber();
        if (object.startNs != null)
            if ($util.Long)
                (message.startNs = $util.Long.fromValue(object.startNs)).unsigned = false;
            else if (typeof object.startNs === "string")
                message.startNs = parseInt(object.startNs, 10);
            else if (typeof object.startNs === "number")
                message.startNs = object.startNs;
            else if (typeof object.startNs === "object")
                message.startNs = new $util.LongBits(object.startNs.low >>> 0, object.startNs.high >>> 0).toNumber();
        return message;
    };

    /**
     * Creates a plain object from a SphCpuFreqData message. Also converts values to other types if specified.
     * @function toObject
     * @memberof SphCpuFreqData
     * @static
     * @param {SphCpuFreqData} message SphCpuFreqData
     * @param {$protobuf.IConversionOptions} [options] Conversion options
     * @returns {Object.<string,*>} Plain object
     */
    SphCpuFreqData.toObject = function toObject(message, options) {
        if (!options)
            options = {};
        var object = {};
        if (options.defaults) {
            object.cpu = 0;
            object.value = 0;
            if ($util.Long) {
                var long = new $util.Long(0, 0, false);
                object.dur = options.longs === String ? long.toString() : options.longs === Number ? long.toNumber() : long;
            } else
                object.dur = options.longs === String ? "0" : 0;
            if ($util.Long) {
                var long = new $util.Long(0, 0, false);
                object.startNs = options.longs === String ? long.toString() : options.longs === Number ? long.toNumber() : long;
            } else
                object.startNs = options.longs === String ? "0" : 0;
        }
        if (message.cpu != null && message.hasOwnProperty("cpu"))
            object.cpu = message.cpu;
        if (message.value != null && message.hasOwnProperty("value"))
            object.value = message.value;
        if (message.dur != null && message.hasOwnProperty("dur"))
            if (typeof message.dur === "number")
                object.dur = options.longs === String ? String(message.dur) : message.dur;
            else
                object.dur = options.longs === String ? $util.Long.prototype.toString.call(message.dur) : options.longs === Number ? new $util.LongBits(message.dur.low >>> 0, message.dur.high >>> 0).toNumber() : message.dur;
        if (message.startNs != null && message.hasOwnProperty("startNs"))
            if (typeof message.startNs === "number")
                object.startNs = options.longs === String ? String(message.startNs) : message.startNs;
            else
                object.startNs = options.longs === String ? $util.Long.prototype.toString.call(message.startNs) : options.longs === Number ? new $util.LongBits(message.startNs.low >>> 0, message.startNs.high >>> 0).toNumber() : message.startNs;
        return object;
    };

    /**
     * Converts this SphCpuFreqData to JSON.
     * @function toJSON
     * @memberof SphCpuFreqData
     * @instance
     * @returns {Object.<string,*>} JSON object
     */
    SphCpuFreqData.prototype.toJSON = function toJSON() {
        return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
    };

    /**
     * Gets the default type url for SphCpuFreqData
     * @function getTypeUrl
     * @memberof SphCpuFreqData
     * @static
     * @param {string} [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
     * @returns {string} The default type url
     */
    SphCpuFreqData.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
        if (typeUrlPrefix === undefined) {
            typeUrlPrefix = "type.googleapis.com";
        }
        return typeUrlPrefix + "/SphCpuFreqData";
    };

    return SphCpuFreqData;
})();

$root.SphProcessData = (function() {

    /**
     * Properties of a SphProcessData.
     * @exports ISphProcessData
     * @interface ISphProcessData
     * @property {number|null} [cpu] SphProcessData cpu
     * @property {number|Long|null} [dur] SphProcessData dur
     * @property {number|Long|null} [startTime] SphProcessData startTime
     */

    /**
     * Constructs a new SphProcessData.
     * @exports SphProcessData
     * @classdesc Represents a SphProcessData.
     * @implements ISphProcessData
     * @constructor
     * @param {ISphProcessData=} [properties] Properties to set
     */
    function SphProcessData(properties) {
        if (properties)
            for (var keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                if (properties[keys[i]] != null)
                    this[keys[i]] = properties[keys[i]];
    }

    /**
     * SphProcessData cpu.
     * @member {number} cpu
     * @memberof SphProcessData
     * @instance
     */
    SphProcessData.prototype.cpu = 0;

    /**
     * SphProcessData dur.
     * @member {number|Long} dur
     * @memberof SphProcessData
     * @instance
     */
    SphProcessData.prototype.dur = $util.Long ? $util.Long.fromBits(0,0,false) : 0;

    /**
     * SphProcessData startTime.
     * @member {number|Long} startTime
     * @memberof SphProcessData
     * @instance
     */
    SphProcessData.prototype.startTime = $util.Long ? $util.Long.fromBits(0,0,false) : 0;

    /**
     * Creates a new SphProcessData instance using the specified properties.
     * @function create
     * @memberof SphProcessData
     * @static
     * @param {ISphProcessData=} [properties] Properties to set
     * @returns {SphProcessData} SphProcessData instance
     */
    SphProcessData.create = function create(properties) {
        return new SphProcessData(properties);
    };

    /**
     * Encodes the specified SphProcessData message. Does not implicitly {@link SphProcessData.verify|verify} messages.
     * @function encode
     * @memberof SphProcessData
     * @static
     * @param {ISphProcessData} message SphProcessData message or plain object to encode
     * @param {$protobuf.Writer} [writer] Writer to encode to
     * @returns {$protobuf.Writer} Writer
     */
    SphProcessData.encode = function encode(message, writer) {
        if (!writer)
            writer = $Writer.create();
        if (message.cpu != null && Object.hasOwnProperty.call(message, "cpu"))
            writer.uint32(/* id 1, wireType 0 =*/8).int32(message.cpu);
        if (message.dur != null && Object.hasOwnProperty.call(message, "dur"))
            writer.uint32(/* id 2, wireType 0 =*/16).int64(message.dur);
        if (message.startTime != null && Object.hasOwnProperty.call(message, "startTime"))
            writer.uint32(/* id 3, wireType 0 =*/24).int64(message.startTime);
        return writer;
    };

    /**
     * Encodes the specified SphProcessData message, length delimited. Does not implicitly {@link SphProcessData.verify|verify} messages.
     * @function encodeDelimited
     * @memberof SphProcessData
     * @static
     * @param {ISphProcessData} message SphProcessData message or plain object to encode
     * @param {$protobuf.Writer} [writer] Writer to encode to
     * @returns {$protobuf.Writer} Writer
     */
    SphProcessData.encodeDelimited = function encodeDelimited(message, writer) {
        return this.encode(message, writer).ldelim();
    };

    /**
     * Decodes a SphProcessData message from the specified reader or buffer.
     * @function decode
     * @memberof SphProcessData
     * @static
     * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
     * @param {number} [length] Message length if known beforehand
     * @returns {SphProcessData} SphProcessData
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    SphProcessData.decode = function decode(reader, length) {
        if (!(reader instanceof $Reader))
            reader = $Reader.create(reader);
        var end = length === undefined ? reader.len : reader.pos + length, message = new $root.SphProcessData();
        while (reader.pos < end) {
            var tag = reader.uint32();
            switch (tag >>> 3) {
            case 1: {
                    message.cpu = reader.int32();
                    break;
                }
            case 2: {
                    message.dur = reader.int64();
                    break;
                }
            case 3: {
                    message.startTime = reader.int64();
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
     * Decodes a SphProcessData message from the specified reader or buffer, length delimited.
     * @function decodeDelimited
     * @memberof SphProcessData
     * @static
     * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
     * @returns {SphProcessData} SphProcessData
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    SphProcessData.decodeDelimited = function decodeDelimited(reader) {
        if (!(reader instanceof $Reader))
            reader = new $Reader(reader);
        return this.decode(reader, reader.uint32());
    };

    /**
     * Verifies a SphProcessData message.
     * @function verify
     * @memberof SphProcessData
     * @static
     * @param {Object.<string,*>} message Plain object to verify
     * @returns {string|null} `null` if valid, otherwise the reason why it is not
     */
    SphProcessData.verify = function verify(message) {
        if (typeof message !== "object" || message === null)
            return "object expected";
        if (message.cpu != null && message.hasOwnProperty("cpu"))
            if (!$util.isInteger(message.cpu))
                return "cpu: integer expected";
        if (message.dur != null && message.hasOwnProperty("dur"))
            if (!$util.isInteger(message.dur) && !(message.dur && $util.isInteger(message.dur.low) && $util.isInteger(message.dur.high)))
                return "dur: integer|Long expected";
        if (message.startTime != null && message.hasOwnProperty("startTime"))
            if (!$util.isInteger(message.startTime) && !(message.startTime && $util.isInteger(message.startTime.low) && $util.isInteger(message.startTime.high)))
                return "startTime: integer|Long expected";
        return null;
    };

    /**
     * Creates a SphProcessData message from a plain object. Also converts values to their respective internal types.
     * @function fromObject
     * @memberof SphProcessData
     * @static
     * @param {Object.<string,*>} object Plain object
     * @returns {SphProcessData} SphProcessData
     */
    SphProcessData.fromObject = function fromObject(object) {
        if (object instanceof $root.SphProcessData)
            return object;
        var message = new $root.SphProcessData();
        if (object.cpu != null)
            message.cpu = object.cpu | 0;
        if (object.dur != null)
            if ($util.Long)
                (message.dur = $util.Long.fromValue(object.dur)).unsigned = false;
            else if (typeof object.dur === "string")
                message.dur = parseInt(object.dur, 10);
            else if (typeof object.dur === "number")
                message.dur = object.dur;
            else if (typeof object.dur === "object")
                message.dur = new $util.LongBits(object.dur.low >>> 0, object.dur.high >>> 0).toNumber();
        if (object.startTime != null)
            if ($util.Long)
                (message.startTime = $util.Long.fromValue(object.startTime)).unsigned = false;
            else if (typeof object.startTime === "string")
                message.startTime = parseInt(object.startTime, 10);
            else if (typeof object.startTime === "number")
                message.startTime = object.startTime;
            else if (typeof object.startTime === "object")
                message.startTime = new $util.LongBits(object.startTime.low >>> 0, object.startTime.high >>> 0).toNumber();
        return message;
    };

    /**
     * Creates a plain object from a SphProcessData message. Also converts values to other types if specified.
     * @function toObject
     * @memberof SphProcessData
     * @static
     * @param {SphProcessData} message SphProcessData
     * @param {$protobuf.IConversionOptions} [options] Conversion options
     * @returns {Object.<string,*>} Plain object
     */
    SphProcessData.toObject = function toObject(message, options) {
        if (!options)
            options = {};
        var object = {};
        if (options.defaults) {
            object.cpu = 0;
            if ($util.Long) {
                var long = new $util.Long(0, 0, false);
                object.dur = options.longs === String ? long.toString() : options.longs === Number ? long.toNumber() : long;
            } else
                object.dur = options.longs === String ? "0" : 0;
            if ($util.Long) {
                var long = new $util.Long(0, 0, false);
                object.startTime = options.longs === String ? long.toString() : options.longs === Number ? long.toNumber() : long;
            } else
                object.startTime = options.longs === String ? "0" : 0;
        }
        if (message.cpu != null && message.hasOwnProperty("cpu"))
            object.cpu = message.cpu;
        if (message.dur != null && message.hasOwnProperty("dur"))
            if (typeof message.dur === "number")
                object.dur = options.longs === String ? String(message.dur) : message.dur;
            else
                object.dur = options.longs === String ? $util.Long.prototype.toString.call(message.dur) : options.longs === Number ? new $util.LongBits(message.dur.low >>> 0, message.dur.high >>> 0).toNumber() : message.dur;
        if (message.startTime != null && message.hasOwnProperty("startTime"))
            if (typeof message.startTime === "number")
                object.startTime = options.longs === String ? String(message.startTime) : message.startTime;
            else
                object.startTime = options.longs === String ? $util.Long.prototype.toString.call(message.startTime) : options.longs === Number ? new $util.LongBits(message.startTime.low >>> 0, message.startTime.high >>> 0).toNumber() : message.startTime;
        return object;
    };

    /**
     * Converts this SphProcessData to JSON.
     * @function toJSON
     * @memberof SphProcessData
     * @instance
     * @returns {Object.<string,*>} JSON object
     */
    SphProcessData.prototype.toJSON = function toJSON() {
        return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
    };

    /**
     * Gets the default type url for SphProcessData
     * @function getTypeUrl
     * @memberof SphProcessData
     * @static
     * @param {string} [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
     * @returns {string} The default type url
     */
    SphProcessData.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
        if (typeUrlPrefix === undefined) {
            typeUrlPrefix = "type.googleapis.com";
        }
        return typeUrlPrefix + "/SphProcessData";
    };

    return SphProcessData;
})();

$root.SphCpuFreqLimitData = (function() {

    /**
     * Properties of a SphCpuFreqLimitData.
     * @exports ISphCpuFreqLimitData
     * @interface ISphCpuFreqLimitData
     * @property {number|null} [max] SphCpuFreqLimitData max
     * @property {number|null} [min] SphCpuFreqLimitData min
     * @property {number|null} [value] SphCpuFreqLimitData value
     * @property {number|Long|null} [dur] SphCpuFreqLimitData dur
     * @property {number|Long|null} [startNs] SphCpuFreqLimitData startNs
     */

    /**
     * Constructs a new SphCpuFreqLimitData.
     * @exports SphCpuFreqLimitData
     * @classdesc Represents a SphCpuFreqLimitData.
     * @implements ISphCpuFreqLimitData
     * @constructor
     * @param {ISphCpuFreqLimitData=} [properties] Properties to set
     */
    function SphCpuFreqLimitData(properties) {
        if (properties)
            for (var keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                if (properties[keys[i]] != null)
                    this[keys[i]] = properties[keys[i]];
    }

    /**
     * SphCpuFreqLimitData max.
     * @member {number} max
     * @memberof SphCpuFreqLimitData
     * @instance
     */
    SphCpuFreqLimitData.prototype.max = 0;

    /**
     * SphCpuFreqLimitData min.
     * @member {number} min
     * @memberof SphCpuFreqLimitData
     * @instance
     */
    SphCpuFreqLimitData.prototype.min = 0;

    /**
     * SphCpuFreqLimitData value.
     * @member {number} value
     * @memberof SphCpuFreqLimitData
     * @instance
     */
    SphCpuFreqLimitData.prototype.value = 0;

    /**
     * SphCpuFreqLimitData dur.
     * @member {number|Long} dur
     * @memberof SphCpuFreqLimitData
     * @instance
     */
    SphCpuFreqLimitData.prototype.dur = $util.Long ? $util.Long.fromBits(0,0,false) : 0;

    /**
     * SphCpuFreqLimitData startNs.
     * @member {number|Long} startNs
     * @memberof SphCpuFreqLimitData
     * @instance
     */
    SphCpuFreqLimitData.prototype.startNs = $util.Long ? $util.Long.fromBits(0,0,false) : 0;

    /**
     * Creates a new SphCpuFreqLimitData instance using the specified properties.
     * @function create
     * @memberof SphCpuFreqLimitData
     * @static
     * @param {ISphCpuFreqLimitData=} [properties] Properties to set
     * @returns {SphCpuFreqLimitData} SphCpuFreqLimitData instance
     */
    SphCpuFreqLimitData.create = function create(properties) {
        return new SphCpuFreqLimitData(properties);
    };

    /**
     * Encodes the specified SphCpuFreqLimitData message. Does not implicitly {@link SphCpuFreqLimitData.verify|verify} messages.
     * @function encode
     * @memberof SphCpuFreqLimitData
     * @static
     * @param {ISphCpuFreqLimitData} message SphCpuFreqLimitData message or plain object to encode
     * @param {$protobuf.Writer} [writer] Writer to encode to
     * @returns {$protobuf.Writer} Writer
     */
    SphCpuFreqLimitData.encode = function encode(message, writer) {
        if (!writer)
            writer = $Writer.create();
        if (message.max != null && Object.hasOwnProperty.call(message, "max"))
            writer.uint32(/* id 1, wireType 0 =*/8).int32(message.max);
        if (message.min != null && Object.hasOwnProperty.call(message, "min"))
            writer.uint32(/* id 2, wireType 0 =*/16).int32(message.min);
        if (message.value != null && Object.hasOwnProperty.call(message, "value"))
            writer.uint32(/* id 3, wireType 0 =*/24).int32(message.value);
        if (message.dur != null && Object.hasOwnProperty.call(message, "dur"))
            writer.uint32(/* id 4, wireType 0 =*/32).int64(message.dur);
        if (message.startNs != null && Object.hasOwnProperty.call(message, "startNs"))
            writer.uint32(/* id 5, wireType 0 =*/40).int64(message.startNs);
        return writer;
    };

    /**
     * Encodes the specified SphCpuFreqLimitData message, length delimited. Does not implicitly {@link SphCpuFreqLimitData.verify|verify} messages.
     * @function encodeDelimited
     * @memberof SphCpuFreqLimitData
     * @static
     * @param {ISphCpuFreqLimitData} message SphCpuFreqLimitData message or plain object to encode
     * @param {$protobuf.Writer} [writer] Writer to encode to
     * @returns {$protobuf.Writer} Writer
     */
    SphCpuFreqLimitData.encodeDelimited = function encodeDelimited(message, writer) {
        return this.encode(message, writer).ldelim();
    };

    /**
     * Decodes a SphCpuFreqLimitData message from the specified reader or buffer.
     * @function decode
     * @memberof SphCpuFreqLimitData
     * @static
     * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
     * @param {number} [length] Message length if known beforehand
     * @returns {SphCpuFreqLimitData} SphCpuFreqLimitData
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    SphCpuFreqLimitData.decode = function decode(reader, length) {
        if (!(reader instanceof $Reader))
            reader = $Reader.create(reader);
        var end = length === undefined ? reader.len : reader.pos + length, message = new $root.SphCpuFreqLimitData();
        while (reader.pos < end) {
            var tag = reader.uint32();
            switch (tag >>> 3) {
            case 1: {
                    message.max = reader.int32();
                    break;
                }
            case 2: {
                    message.min = reader.int32();
                    break;
                }
            case 3: {
                    message.value = reader.int32();
                    break;
                }
            case 4: {
                    message.dur = reader.int64();
                    break;
                }
            case 5: {
                    message.startNs = reader.int64();
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
     * Decodes a SphCpuFreqLimitData message from the specified reader or buffer, length delimited.
     * @function decodeDelimited
     * @memberof SphCpuFreqLimitData
     * @static
     * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
     * @returns {SphCpuFreqLimitData} SphCpuFreqLimitData
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    SphCpuFreqLimitData.decodeDelimited = function decodeDelimited(reader) {
        if (!(reader instanceof $Reader))
            reader = new $Reader(reader);
        return this.decode(reader, reader.uint32());
    };

    /**
     * Verifies a SphCpuFreqLimitData message.
     * @function verify
     * @memberof SphCpuFreqLimitData
     * @static
     * @param {Object.<string,*>} message Plain object to verify
     * @returns {string|null} `null` if valid, otherwise the reason why it is not
     */
    SphCpuFreqLimitData.verify = function verify(message) {
        if (typeof message !== "object" || message === null)
            return "object expected";
        if (message.max != null && message.hasOwnProperty("max"))
            if (!$util.isInteger(message.max))
                return "max: integer expected";
        if (message.min != null && message.hasOwnProperty("min"))
            if (!$util.isInteger(message.min))
                return "min: integer expected";
        if (message.value != null && message.hasOwnProperty("value"))
            if (!$util.isInteger(message.value))
                return "value: integer expected";
        if (message.dur != null && message.hasOwnProperty("dur"))
            if (!$util.isInteger(message.dur) && !(message.dur && $util.isInteger(message.dur.low) && $util.isInteger(message.dur.high)))
                return "dur: integer|Long expected";
        if (message.startNs != null && message.hasOwnProperty("startNs"))
            if (!$util.isInteger(message.startNs) && !(message.startNs && $util.isInteger(message.startNs.low) && $util.isInteger(message.startNs.high)))
                return "startNs: integer|Long expected";
        return null;
    };

    /**
     * Creates a SphCpuFreqLimitData message from a plain object. Also converts values to their respective internal types.
     * @function fromObject
     * @memberof SphCpuFreqLimitData
     * @static
     * @param {Object.<string,*>} object Plain object
     * @returns {SphCpuFreqLimitData} SphCpuFreqLimitData
     */
    SphCpuFreqLimitData.fromObject = function fromObject(object) {
        if (object instanceof $root.SphCpuFreqLimitData)
            return object;
        var message = new $root.SphCpuFreqLimitData();
        if (object.max != null)
            message.max = object.max | 0;
        if (object.min != null)
            message.min = object.min | 0;
        if (object.value != null)
            message.value = object.value | 0;
        if (object.dur != null)
            if ($util.Long)
                (message.dur = $util.Long.fromValue(object.dur)).unsigned = false;
            else if (typeof object.dur === "string")
                message.dur = parseInt(object.dur, 10);
            else if (typeof object.dur === "number")
                message.dur = object.dur;
            else if (typeof object.dur === "object")
                message.dur = new $util.LongBits(object.dur.low >>> 0, object.dur.high >>> 0).toNumber();
        if (object.startNs != null)
            if ($util.Long)
                (message.startNs = $util.Long.fromValue(object.startNs)).unsigned = false;
            else if (typeof object.startNs === "string")
                message.startNs = parseInt(object.startNs, 10);
            else if (typeof object.startNs === "number")
                message.startNs = object.startNs;
            else if (typeof object.startNs === "object")
                message.startNs = new $util.LongBits(object.startNs.low >>> 0, object.startNs.high >>> 0).toNumber();
        return message;
    };

    /**
     * Creates a plain object from a SphCpuFreqLimitData message. Also converts values to other types if specified.
     * @function toObject
     * @memberof SphCpuFreqLimitData
     * @static
     * @param {SphCpuFreqLimitData} message SphCpuFreqLimitData
     * @param {$protobuf.IConversionOptions} [options] Conversion options
     * @returns {Object.<string,*>} Plain object
     */
    SphCpuFreqLimitData.toObject = function toObject(message, options) {
        if (!options)
            options = {};
        var object = {};
        if (options.defaults) {
            object.max = 0;
            object.min = 0;
            object.value = 0;
            if ($util.Long) {
                var long = new $util.Long(0, 0, false);
                object.dur = options.longs === String ? long.toString() : options.longs === Number ? long.toNumber() : long;
            } else
                object.dur = options.longs === String ? "0" : 0;
            if ($util.Long) {
                var long = new $util.Long(0, 0, false);
                object.startNs = options.longs === String ? long.toString() : options.longs === Number ? long.toNumber() : long;
            } else
                object.startNs = options.longs === String ? "0" : 0;
        }
        if (message.max != null && message.hasOwnProperty("max"))
            object.max = message.max;
        if (message.min != null && message.hasOwnProperty("min"))
            object.min = message.min;
        if (message.value != null && message.hasOwnProperty("value"))
            object.value = message.value;
        if (message.dur != null && message.hasOwnProperty("dur"))
            if (typeof message.dur === "number")
                object.dur = options.longs === String ? String(message.dur) : message.dur;
            else
                object.dur = options.longs === String ? $util.Long.prototype.toString.call(message.dur) : options.longs === Number ? new $util.LongBits(message.dur.low >>> 0, message.dur.high >>> 0).toNumber() : message.dur;
        if (message.startNs != null && message.hasOwnProperty("startNs"))
            if (typeof message.startNs === "number")
                object.startNs = options.longs === String ? String(message.startNs) : message.startNs;
            else
                object.startNs = options.longs === String ? $util.Long.prototype.toString.call(message.startNs) : options.longs === Number ? new $util.LongBits(message.startNs.low >>> 0, message.startNs.high >>> 0).toNumber() : message.startNs;
        return object;
    };

    /**
     * Converts this SphCpuFreqLimitData to JSON.
     * @function toJSON
     * @memberof SphCpuFreqLimitData
     * @instance
     * @returns {Object.<string,*>} JSON object
     */
    SphCpuFreqLimitData.prototype.toJSON = function toJSON() {
        return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
    };

    /**
     * Gets the default type url for SphCpuFreqLimitData
     * @function getTypeUrl
     * @memberof SphCpuFreqLimitData
     * @static
     * @param {string} [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
     * @returns {string} The default type url
     */
    SphCpuFreqLimitData.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
        if (typeUrlPrefix === undefined) {
            typeUrlPrefix = "type.googleapis.com";
        }
        return typeUrlPrefix + "/SphCpuFreqLimitData";
    };

    return SphCpuFreqLimitData;
})();

$root.SphCpuStateData = (function() {

    /**
     * Properties of a SphCpuStateData.
     * @exports ISphCpuStateData
     * @interface ISphCpuStateData
     * @property {number|null} [value] SphCpuStateData value
     * @property {number|Long|null} [dur] SphCpuStateData dur
     * @property {number|Long|null} [startTs] SphCpuStateData startTs
     */

    /**
     * Constructs a new SphCpuStateData.
     * @exports SphCpuStateData
     * @classdesc Represents a SphCpuStateData.
     * @implements ISphCpuStateData
     * @constructor
     * @param {ISphCpuStateData=} [properties] Properties to set
     */
    function SphCpuStateData(properties) {
        if (properties)
            for (var keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                if (properties[keys[i]] != null)
                    this[keys[i]] = properties[keys[i]];
    }

    /**
     * SphCpuStateData value.
     * @member {number} value
     * @memberof SphCpuStateData
     * @instance
     */
    SphCpuStateData.prototype.value = 0;

    /**
     * SphCpuStateData dur.
     * @member {number|Long} dur
     * @memberof SphCpuStateData
     * @instance
     */
    SphCpuStateData.prototype.dur = $util.Long ? $util.Long.fromBits(0,0,false) : 0;

    /**
     * SphCpuStateData startTs.
     * @member {number|Long} startTs
     * @memberof SphCpuStateData
     * @instance
     */
    SphCpuStateData.prototype.startTs = $util.Long ? $util.Long.fromBits(0,0,false) : 0;

    /**
     * Creates a new SphCpuStateData instance using the specified properties.
     * @function create
     * @memberof SphCpuStateData
     * @static
     * @param {ISphCpuStateData=} [properties] Properties to set
     * @returns {SphCpuStateData} SphCpuStateData instance
     */
    SphCpuStateData.create = function create(properties) {
        return new SphCpuStateData(properties);
    };

    /**
     * Encodes the specified SphCpuStateData message. Does not implicitly {@link SphCpuStateData.verify|verify} messages.
     * @function encode
     * @memberof SphCpuStateData
     * @static
     * @param {ISphCpuStateData} message SphCpuStateData message or plain object to encode
     * @param {$protobuf.Writer} [writer] Writer to encode to
     * @returns {$protobuf.Writer} Writer
     */
    SphCpuStateData.encode = function encode(message, writer) {
        if (!writer)
            writer = $Writer.create();
        if (message.value != null && Object.hasOwnProperty.call(message, "value"))
            writer.uint32(/* id 1, wireType 0 =*/8).int32(message.value);
        if (message.dur != null && Object.hasOwnProperty.call(message, "dur"))
            writer.uint32(/* id 2, wireType 0 =*/16).int64(message.dur);
        if (message.startTs != null && Object.hasOwnProperty.call(message, "startTs"))
            writer.uint32(/* id 3, wireType 0 =*/24).int64(message.startTs);
        return writer;
    };

    /**
     * Encodes the specified SphCpuStateData message, length delimited. Does not implicitly {@link SphCpuStateData.verify|verify} messages.
     * @function encodeDelimited
     * @memberof SphCpuStateData
     * @static
     * @param {ISphCpuStateData} message SphCpuStateData message or plain object to encode
     * @param {$protobuf.Writer} [writer] Writer to encode to
     * @returns {$protobuf.Writer} Writer
     */
    SphCpuStateData.encodeDelimited = function encodeDelimited(message, writer) {
        return this.encode(message, writer).ldelim();
    };

    /**
     * Decodes a SphCpuStateData message from the specified reader or buffer.
     * @function decode
     * @memberof SphCpuStateData
     * @static
     * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
     * @param {number} [length] Message length if known beforehand
     * @returns {SphCpuStateData} SphCpuStateData
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    SphCpuStateData.decode = function decode(reader, length) {
        if (!(reader instanceof $Reader))
            reader = $Reader.create(reader);
        var end = length === undefined ? reader.len : reader.pos + length, message = new $root.SphCpuStateData();
        while (reader.pos < end) {
            var tag = reader.uint32();
            switch (tag >>> 3) {
            case 1: {
                    message.value = reader.int32();
                    break;
                }
            case 2: {
                    message.dur = reader.int64();
                    break;
                }
            case 3: {
                    message.startTs = reader.int64();
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
     * Decodes a SphCpuStateData message from the specified reader or buffer, length delimited.
     * @function decodeDelimited
     * @memberof SphCpuStateData
     * @static
     * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
     * @returns {SphCpuStateData} SphCpuStateData
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    SphCpuStateData.decodeDelimited = function decodeDelimited(reader) {
        if (!(reader instanceof $Reader))
            reader = new $Reader(reader);
        return this.decode(reader, reader.uint32());
    };

    /**
     * Verifies a SphCpuStateData message.
     * @function verify
     * @memberof SphCpuStateData
     * @static
     * @param {Object.<string,*>} message Plain object to verify
     * @returns {string|null} `null` if valid, otherwise the reason why it is not
     */
    SphCpuStateData.verify = function verify(message) {
        if (typeof message !== "object" || message === null)
            return "object expected";
        if (message.value != null && message.hasOwnProperty("value"))
            if (!$util.isInteger(message.value))
                return "value: integer expected";
        if (message.dur != null && message.hasOwnProperty("dur"))
            if (!$util.isInteger(message.dur) && !(message.dur && $util.isInteger(message.dur.low) && $util.isInteger(message.dur.high)))
                return "dur: integer|Long expected";
        if (message.startTs != null && message.hasOwnProperty("startTs"))
            if (!$util.isInteger(message.startTs) && !(message.startTs && $util.isInteger(message.startTs.low) && $util.isInteger(message.startTs.high)))
                return "startTs: integer|Long expected";
        return null;
    };

    /**
     * Creates a SphCpuStateData message from a plain object. Also converts values to their respective internal types.
     * @function fromObject
     * @memberof SphCpuStateData
     * @static
     * @param {Object.<string,*>} object Plain object
     * @returns {SphCpuStateData} SphCpuStateData
     */
    SphCpuStateData.fromObject = function fromObject(object) {
        if (object instanceof $root.SphCpuStateData)
            return object;
        var message = new $root.SphCpuStateData();
        if (object.value != null)
            message.value = object.value | 0;
        if (object.dur != null)
            if ($util.Long)
                (message.dur = $util.Long.fromValue(object.dur)).unsigned = false;
            else if (typeof object.dur === "string")
                message.dur = parseInt(object.dur, 10);
            else if (typeof object.dur === "number")
                message.dur = object.dur;
            else if (typeof object.dur === "object")
                message.dur = new $util.LongBits(object.dur.low >>> 0, object.dur.high >>> 0).toNumber();
        if (object.startTs != null)
            if ($util.Long)
                (message.startTs = $util.Long.fromValue(object.startTs)).unsigned = false;
            else if (typeof object.startTs === "string")
                message.startTs = parseInt(object.startTs, 10);
            else if (typeof object.startTs === "number")
                message.startTs = object.startTs;
            else if (typeof object.startTs === "object")
                message.startTs = new $util.LongBits(object.startTs.low >>> 0, object.startTs.high >>> 0).toNumber();
        return message;
    };

    /**
     * Creates a plain object from a SphCpuStateData message. Also converts values to other types if specified.
     * @function toObject
     * @memberof SphCpuStateData
     * @static
     * @param {SphCpuStateData} message SphCpuStateData
     * @param {$protobuf.IConversionOptions} [options] Conversion options
     * @returns {Object.<string,*>} Plain object
     */
    SphCpuStateData.toObject = function toObject(message, options) {
        if (!options)
            options = {};
        var object = {};
        if (options.defaults) {
            object.value = 0;
            if ($util.Long) {
                var long = new $util.Long(0, 0, false);
                object.dur = options.longs === String ? long.toString() : options.longs === Number ? long.toNumber() : long;
            } else
                object.dur = options.longs === String ? "0" : 0;
            if ($util.Long) {
                var long = new $util.Long(0, 0, false);
                object.startTs = options.longs === String ? long.toString() : options.longs === Number ? long.toNumber() : long;
            } else
                object.startTs = options.longs === String ? "0" : 0;
        }
        if (message.value != null && message.hasOwnProperty("value"))
            object.value = message.value;
        if (message.dur != null && message.hasOwnProperty("dur"))
            if (typeof message.dur === "number")
                object.dur = options.longs === String ? String(message.dur) : message.dur;
            else
                object.dur = options.longs === String ? $util.Long.prototype.toString.call(message.dur) : options.longs === Number ? new $util.LongBits(message.dur.low >>> 0, message.dur.high >>> 0).toNumber() : message.dur;
        if (message.startTs != null && message.hasOwnProperty("startTs"))
            if (typeof message.startTs === "number")
                object.startTs = options.longs === String ? String(message.startTs) : message.startTs;
            else
                object.startTs = options.longs === String ? $util.Long.prototype.toString.call(message.startTs) : options.longs === Number ? new $util.LongBits(message.startTs.low >>> 0, message.startTs.high >>> 0).toNumber() : message.startTs;
        return object;
    };

    /**
     * Converts this SphCpuStateData to JSON.
     * @function toJSON
     * @memberof SphCpuStateData
     * @instance
     * @returns {Object.<string,*>} JSON object
     */
    SphCpuStateData.prototype.toJSON = function toJSON() {
        return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
    };

    /**
     * Gets the default type url for SphCpuStateData
     * @function getTypeUrl
     * @memberof SphCpuStateData
     * @static
     * @param {string} [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
     * @returns {string} The default type url
     */
    SphCpuStateData.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
        if (typeUrlPrefix === undefined) {
            typeUrlPrefix = "type.googleapis.com";
        }
        return typeUrlPrefix + "/SphCpuStateData";
    };

    return SphCpuStateData;
})();

$root.SphProcessMemData = (function() {

    /**
     * Properties of a SphProcessMemData.
     * @exports ISphProcessMemData
     * @interface ISphProcessMemData
     * @property {number|null} [trackId] SphProcessMemData trackId
     * @property {number|null} [value] SphProcessMemData value
     * @property {number|Long|null} [startTime] SphProcessMemData startTime
     * @property {number|Long|null} [ts] SphProcessMemData ts
     */

    /**
     * Constructs a new SphProcessMemData.
     * @exports SphProcessMemData
     * @classdesc Represents a SphProcessMemData.
     * @implements ISphProcessMemData
     * @constructor
     * @param {ISphProcessMemData=} [properties] Properties to set
     */
    function SphProcessMemData(properties) {
        if (properties)
            for (var keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                if (properties[keys[i]] != null)
                    this[keys[i]] = properties[keys[i]];
    }

    /**
     * SphProcessMemData trackId.
     * @member {number} trackId
     * @memberof SphProcessMemData
     * @instance
     */
    SphProcessMemData.prototype.trackId = 0;

    /**
     * SphProcessMemData value.
     * @member {number} value
     * @memberof SphProcessMemData
     * @instance
     */
    SphProcessMemData.prototype.value = 0;

    /**
     * SphProcessMemData startTime.
     * @member {number|Long} startTime
     * @memberof SphProcessMemData
     * @instance
     */
    SphProcessMemData.prototype.startTime = $util.Long ? $util.Long.fromBits(0,0,false) : 0;

    /**
     * SphProcessMemData ts.
     * @member {number|Long} ts
     * @memberof SphProcessMemData
     * @instance
     */
    SphProcessMemData.prototype.ts = $util.Long ? $util.Long.fromBits(0,0,false) : 0;

    /**
     * Creates a new SphProcessMemData instance using the specified properties.
     * @function create
     * @memberof SphProcessMemData
     * @static
     * @param {ISphProcessMemData=} [properties] Properties to set
     * @returns {SphProcessMemData} SphProcessMemData instance
     */
    SphProcessMemData.create = function create(properties) {
        return new SphProcessMemData(properties);
    };

    /**
     * Encodes the specified SphProcessMemData message. Does not implicitly {@link SphProcessMemData.verify|verify} messages.
     * @function encode
     * @memberof SphProcessMemData
     * @static
     * @param {ISphProcessMemData} message SphProcessMemData message or plain object to encode
     * @param {$protobuf.Writer} [writer] Writer to encode to
     * @returns {$protobuf.Writer} Writer
     */
    SphProcessMemData.encode = function encode(message, writer) {
        if (!writer)
            writer = $Writer.create();
        if (message.trackId != null && Object.hasOwnProperty.call(message, "trackId"))
            writer.uint32(/* id 1, wireType 0 =*/8).int32(message.trackId);
        if (message.value != null && Object.hasOwnProperty.call(message, "value"))
            writer.uint32(/* id 2, wireType 0 =*/16).int32(message.value);
        if (message.startTime != null && Object.hasOwnProperty.call(message, "startTime"))
            writer.uint32(/* id 3, wireType 0 =*/24).int64(message.startTime);
        if (message.ts != null && Object.hasOwnProperty.call(message, "ts"))
            writer.uint32(/* id 4, wireType 0 =*/32).int64(message.ts);
        return writer;
    };

    /**
     * Encodes the specified SphProcessMemData message, length delimited. Does not implicitly {@link SphProcessMemData.verify|verify} messages.
     * @function encodeDelimited
     * @memberof SphProcessMemData
     * @static
     * @param {ISphProcessMemData} message SphProcessMemData message or plain object to encode
     * @param {$protobuf.Writer} [writer] Writer to encode to
     * @returns {$protobuf.Writer} Writer
     */
    SphProcessMemData.encodeDelimited = function encodeDelimited(message, writer) {
        return this.encode(message, writer).ldelim();
    };

    /**
     * Decodes a SphProcessMemData message from the specified reader or buffer.
     * @function decode
     * @memberof SphProcessMemData
     * @static
     * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
     * @param {number} [length] Message length if known beforehand
     * @returns {SphProcessMemData} SphProcessMemData
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    SphProcessMemData.decode = function decode(reader, length) {
        if (!(reader instanceof $Reader))
            reader = $Reader.create(reader);
        var end = length === undefined ? reader.len : reader.pos + length, message = new $root.SphProcessMemData();
        while (reader.pos < end) {
            var tag = reader.uint32();
            switch (tag >>> 3) {
            case 1: {
                    message.trackId = reader.int32();
                    break;
                }
            case 2: {
                    message.value = reader.int32();
                    break;
                }
            case 3: {
                    message.startTime = reader.int64();
                    break;
                }
            case 4: {
                    message.ts = reader.int64();
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
     * Decodes a SphProcessMemData message from the specified reader or buffer, length delimited.
     * @function decodeDelimited
     * @memberof SphProcessMemData
     * @static
     * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
     * @returns {SphProcessMemData} SphProcessMemData
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    SphProcessMemData.decodeDelimited = function decodeDelimited(reader) {
        if (!(reader instanceof $Reader))
            reader = new $Reader(reader);
        return this.decode(reader, reader.uint32());
    };

    /**
     * Verifies a SphProcessMemData message.
     * @function verify
     * @memberof SphProcessMemData
     * @static
     * @param {Object.<string,*>} message Plain object to verify
     * @returns {string|null} `null` if valid, otherwise the reason why it is not
     */
    SphProcessMemData.verify = function verify(message) {
        if (typeof message !== "object" || message === null)
            return "object expected";
        if (message.trackId != null && message.hasOwnProperty("trackId"))
            if (!$util.isInteger(message.trackId))
                return "trackId: integer expected";
        if (message.value != null && message.hasOwnProperty("value"))
            if (!$util.isInteger(message.value))
                return "value: integer expected";
        if (message.startTime != null && message.hasOwnProperty("startTime"))
            if (!$util.isInteger(message.startTime) && !(message.startTime && $util.isInteger(message.startTime.low) && $util.isInteger(message.startTime.high)))
                return "startTime: integer|Long expected";
        if (message.ts != null && message.hasOwnProperty("ts"))
            if (!$util.isInteger(message.ts) && !(message.ts && $util.isInteger(message.ts.low) && $util.isInteger(message.ts.high)))
                return "ts: integer|Long expected";
        return null;
    };

    /**
     * Creates a SphProcessMemData message from a plain object. Also converts values to their respective internal types.
     * @function fromObject
     * @memberof SphProcessMemData
     * @static
     * @param {Object.<string,*>} object Plain object
     * @returns {SphProcessMemData} SphProcessMemData
     */
    SphProcessMemData.fromObject = function fromObject(object) {
        if (object instanceof $root.SphProcessMemData)
            return object;
        var message = new $root.SphProcessMemData();
        if (object.trackId != null)
            message.trackId = object.trackId | 0;
        if (object.value != null)
            message.value = object.value | 0;
        if (object.startTime != null)
            if ($util.Long)
                (message.startTime = $util.Long.fromValue(object.startTime)).unsigned = false;
            else if (typeof object.startTime === "string")
                message.startTime = parseInt(object.startTime, 10);
            else if (typeof object.startTime === "number")
                message.startTime = object.startTime;
            else if (typeof object.startTime === "object")
                message.startTime = new $util.LongBits(object.startTime.low >>> 0, object.startTime.high >>> 0).toNumber();
        if (object.ts != null)
            if ($util.Long)
                (message.ts = $util.Long.fromValue(object.ts)).unsigned = false;
            else if (typeof object.ts === "string")
                message.ts = parseInt(object.ts, 10);
            else if (typeof object.ts === "number")
                message.ts = object.ts;
            else if (typeof object.ts === "object")
                message.ts = new $util.LongBits(object.ts.low >>> 0, object.ts.high >>> 0).toNumber();
        return message;
    };

    /**
     * Creates a plain object from a SphProcessMemData message. Also converts values to other types if specified.
     * @function toObject
     * @memberof SphProcessMemData
     * @static
     * @param {SphProcessMemData} message SphProcessMemData
     * @param {$protobuf.IConversionOptions} [options] Conversion options
     * @returns {Object.<string,*>} Plain object
     */
    SphProcessMemData.toObject = function toObject(message, options) {
        if (!options)
            options = {};
        var object = {};
        if (options.defaults) {
            object.trackId = 0;
            object.value = 0;
            if ($util.Long) {
                var long = new $util.Long(0, 0, false);
                object.startTime = options.longs === String ? long.toString() : options.longs === Number ? long.toNumber() : long;
            } else
                object.startTime = options.longs === String ? "0" : 0;
            if ($util.Long) {
                var long = new $util.Long(0, 0, false);
                object.ts = options.longs === String ? long.toString() : options.longs === Number ? long.toNumber() : long;
            } else
                object.ts = options.longs === String ? "0" : 0;
        }
        if (message.trackId != null && message.hasOwnProperty("trackId"))
            object.trackId = message.trackId;
        if (message.value != null && message.hasOwnProperty("value"))
            object.value = message.value;
        if (message.startTime != null && message.hasOwnProperty("startTime"))
            if (typeof message.startTime === "number")
                object.startTime = options.longs === String ? String(message.startTime) : message.startTime;
            else
                object.startTime = options.longs === String ? $util.Long.prototype.toString.call(message.startTime) : options.longs === Number ? new $util.LongBits(message.startTime.low >>> 0, message.startTime.high >>> 0).toNumber() : message.startTime;
        if (message.ts != null && message.hasOwnProperty("ts"))
            if (typeof message.ts === "number")
                object.ts = options.longs === String ? String(message.ts) : message.ts;
            else
                object.ts = options.longs === String ? $util.Long.prototype.toString.call(message.ts) : options.longs === Number ? new $util.LongBits(message.ts.low >>> 0, message.ts.high >>> 0).toNumber() : message.ts;
        return object;
    };

    /**
     * Converts this SphProcessMemData to JSON.
     * @function toJSON
     * @memberof SphProcessMemData
     * @instance
     * @returns {Object.<string,*>} JSON object
     */
    SphProcessMemData.prototype.toJSON = function toJSON() {
        return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
    };

    /**
     * Gets the default type url for SphProcessMemData
     * @function getTypeUrl
     * @memberof SphProcessMemData
     * @static
     * @param {string} [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
     * @returns {string} The default type url
     */
    SphProcessMemData.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
        if (typeUrlPrefix === undefined) {
            typeUrlPrefix = "type.googleapis.com";
        }
        return typeUrlPrefix + "/SphProcessMemData";
    };

    return SphProcessMemData;
})();

$root.SphProcessSoInitData = (function() {

    /**
     * Properties of a SphProcessSoInitData.
     * @exports ISphProcessSoInitData
     * @interface ISphProcessSoInitData
     * @property {number|null} [depth] SphProcessSoInitData depth
     * @property {number|null} [pid] SphProcessSoInitData pid
     * @property {number|null} [tid] SphProcessSoInitData tid
     * @property {number|null} [itid] SphProcessSoInitData itid
     * @property {number|Long|null} [startTime] SphProcessSoInitData startTime
     * @property {number|Long|null} [dur] SphProcessSoInitData dur
     * @property {number|null} [id] SphProcessSoInitData id
     */

    /**
     * Constructs a new SphProcessSoInitData.
     * @exports SphProcessSoInitData
     * @classdesc Represents a SphProcessSoInitData.
     * @implements ISphProcessSoInitData
     * @constructor
     * @param {ISphProcessSoInitData=} [properties] Properties to set
     */
    function SphProcessSoInitData(properties) {
        if (properties)
            for (var keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                if (properties[keys[i]] != null)
                    this[keys[i]] = properties[keys[i]];
    }

    /**
     * SphProcessSoInitData depth.
     * @member {number} depth
     * @memberof SphProcessSoInitData
     * @instance
     */
    SphProcessSoInitData.prototype.depth = 0;

    /**
     * SphProcessSoInitData pid.
     * @member {number} pid
     * @memberof SphProcessSoInitData
     * @instance
     */
    SphProcessSoInitData.prototype.pid = 0;

    /**
     * SphProcessSoInitData tid.
     * @member {number} tid
     * @memberof SphProcessSoInitData
     * @instance
     */
    SphProcessSoInitData.prototype.tid = 0;

    /**
     * SphProcessSoInitData itid.
     * @member {number} itid
     * @memberof SphProcessSoInitData
     * @instance
     */
    SphProcessSoInitData.prototype.itid = 0;

    /**
     * SphProcessSoInitData startTime.
     * @member {number|Long} startTime
     * @memberof SphProcessSoInitData
     * @instance
     */
    SphProcessSoInitData.prototype.startTime = $util.Long ? $util.Long.fromBits(0,0,false) : 0;

    /**
     * SphProcessSoInitData dur.
     * @member {number|Long} dur
     * @memberof SphProcessSoInitData
     * @instance
     */
    SphProcessSoInitData.prototype.dur = $util.Long ? $util.Long.fromBits(0,0,false) : 0;

    /**
     * SphProcessSoInitData id.
     * @member {number} id
     * @memberof SphProcessSoInitData
     * @instance
     */
    SphProcessSoInitData.prototype.id = 0;

    /**
     * Creates a new SphProcessSoInitData instance using the specified properties.
     * @function create
     * @memberof SphProcessSoInitData
     * @static
     * @param {ISphProcessSoInitData=} [properties] Properties to set
     * @returns {SphProcessSoInitData} SphProcessSoInitData instance
     */
    SphProcessSoInitData.create = function create(properties) {
        return new SphProcessSoInitData(properties);
    };

    /**
     * Encodes the specified SphProcessSoInitData message. Does not implicitly {@link SphProcessSoInitData.verify|verify} messages.
     * @function encode
     * @memberof SphProcessSoInitData
     * @static
     * @param {ISphProcessSoInitData} message SphProcessSoInitData message or plain object to encode
     * @param {$protobuf.Writer} [writer] Writer to encode to
     * @returns {$protobuf.Writer} Writer
     */
    SphProcessSoInitData.encode = function encode(message, writer) {
        if (!writer)
            writer = $Writer.create();
        if (message.depth != null && Object.hasOwnProperty.call(message, "depth"))
            writer.uint32(/* id 1, wireType 0 =*/8).int32(message.depth);
        if (message.pid != null && Object.hasOwnProperty.call(message, "pid"))
            writer.uint32(/* id 2, wireType 0 =*/16).int32(message.pid);
        if (message.tid != null && Object.hasOwnProperty.call(message, "tid"))
            writer.uint32(/* id 3, wireType 0 =*/24).int32(message.tid);
        if (message.itid != null && Object.hasOwnProperty.call(message, "itid"))
            writer.uint32(/* id 4, wireType 0 =*/32).int32(message.itid);
        if (message.startTime != null && Object.hasOwnProperty.call(message, "startTime"))
            writer.uint32(/* id 5, wireType 0 =*/40).int64(message.startTime);
        if (message.dur != null && Object.hasOwnProperty.call(message, "dur"))
            writer.uint32(/* id 6, wireType 0 =*/48).int64(message.dur);
        if (message.id != null && Object.hasOwnProperty.call(message, "id"))
            writer.uint32(/* id 7, wireType 0 =*/56).int32(message.id);
        return writer;
    };

    /**
     * Encodes the specified SphProcessSoInitData message, length delimited. Does not implicitly {@link SphProcessSoInitData.verify|verify} messages.
     * @function encodeDelimited
     * @memberof SphProcessSoInitData
     * @static
     * @param {ISphProcessSoInitData} message SphProcessSoInitData message or plain object to encode
     * @param {$protobuf.Writer} [writer] Writer to encode to
     * @returns {$protobuf.Writer} Writer
     */
    SphProcessSoInitData.encodeDelimited = function encodeDelimited(message, writer) {
        return this.encode(message, writer).ldelim();
    };

    /**
     * Decodes a SphProcessSoInitData message from the specified reader or buffer.
     * @function decode
     * @memberof SphProcessSoInitData
     * @static
     * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
     * @param {number} [length] Message length if known beforehand
     * @returns {SphProcessSoInitData} SphProcessSoInitData
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    SphProcessSoInitData.decode = function decode(reader, length) {
        if (!(reader instanceof $Reader))
            reader = $Reader.create(reader);
        var end = length === undefined ? reader.len : reader.pos + length, message = new $root.SphProcessSoInitData();
        while (reader.pos < end) {
            var tag = reader.uint32();
            switch (tag >>> 3) {
            case 1: {
                    message.depth = reader.int32();
                    break;
                }
            case 2: {
                    message.pid = reader.int32();
                    break;
                }
            case 3: {
                    message.tid = reader.int32();
                    break;
                }
            case 4: {
                    message.itid = reader.int32();
                    break;
                }
            case 5: {
                    message.startTime = reader.int64();
                    break;
                }
            case 6: {
                    message.dur = reader.int64();
                    break;
                }
            case 7: {
                    message.id = reader.int32();
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
     * Decodes a SphProcessSoInitData message from the specified reader or buffer, length delimited.
     * @function decodeDelimited
     * @memberof SphProcessSoInitData
     * @static
     * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
     * @returns {SphProcessSoInitData} SphProcessSoInitData
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    SphProcessSoInitData.decodeDelimited = function decodeDelimited(reader) {
        if (!(reader instanceof $Reader))
            reader = new $Reader(reader);
        return this.decode(reader, reader.uint32());
    };

    /**
     * Verifies a SphProcessSoInitData message.
     * @function verify
     * @memberof SphProcessSoInitData
     * @static
     * @param {Object.<string,*>} message Plain object to verify
     * @returns {string|null} `null` if valid, otherwise the reason why it is not
     */
    SphProcessSoInitData.verify = function verify(message) {
        if (typeof message !== "object" || message === null)
            return "object expected";
        if (message.depth != null && message.hasOwnProperty("depth"))
            if (!$util.isInteger(message.depth))
                return "depth: integer expected";
        if (message.pid != null && message.hasOwnProperty("pid"))
            if (!$util.isInteger(message.pid))
                return "pid: integer expected";
        if (message.tid != null && message.hasOwnProperty("tid"))
            if (!$util.isInteger(message.tid))
                return "tid: integer expected";
        if (message.itid != null && message.hasOwnProperty("itid"))
            if (!$util.isInteger(message.itid))
                return "itid: integer expected";
        if (message.startTime != null && message.hasOwnProperty("startTime"))
            if (!$util.isInteger(message.startTime) && !(message.startTime && $util.isInteger(message.startTime.low) && $util.isInteger(message.startTime.high)))
                return "startTime: integer|Long expected";
        if (message.dur != null && message.hasOwnProperty("dur"))
            if (!$util.isInteger(message.dur) && !(message.dur && $util.isInteger(message.dur.low) && $util.isInteger(message.dur.high)))
                return "dur: integer|Long expected";
        if (message.id != null && message.hasOwnProperty("id"))
            if (!$util.isInteger(message.id))
                return "id: integer expected";
        return null;
    };

    /**
     * Creates a SphProcessSoInitData message from a plain object. Also converts values to their respective internal types.
     * @function fromObject
     * @memberof SphProcessSoInitData
     * @static
     * @param {Object.<string,*>} object Plain object
     * @returns {SphProcessSoInitData} SphProcessSoInitData
     */
    SphProcessSoInitData.fromObject = function fromObject(object) {
        if (object instanceof $root.SphProcessSoInitData)
            return object;
        var message = new $root.SphProcessSoInitData();
        if (object.depth != null)
            message.depth = object.depth | 0;
        if (object.pid != null)
            message.pid = object.pid | 0;
        if (object.tid != null)
            message.tid = object.tid | 0;
        if (object.itid != null)
            message.itid = object.itid | 0;
        if (object.startTime != null)
            if ($util.Long)
                (message.startTime = $util.Long.fromValue(object.startTime)).unsigned = false;
            else if (typeof object.startTime === "string")
                message.startTime = parseInt(object.startTime, 10);
            else if (typeof object.startTime === "number")
                message.startTime = object.startTime;
            else if (typeof object.startTime === "object")
                message.startTime = new $util.LongBits(object.startTime.low >>> 0, object.startTime.high >>> 0).toNumber();
        if (object.dur != null)
            if ($util.Long)
                (message.dur = $util.Long.fromValue(object.dur)).unsigned = false;
            else if (typeof object.dur === "string")
                message.dur = parseInt(object.dur, 10);
            else if (typeof object.dur === "number")
                message.dur = object.dur;
            else if (typeof object.dur === "object")
                message.dur = new $util.LongBits(object.dur.low >>> 0, object.dur.high >>> 0).toNumber();
        if (object.id != null)
            message.id = object.id | 0;
        return message;
    };

    /**
     * Creates a plain object from a SphProcessSoInitData message. Also converts values to other types if specified.
     * @function toObject
     * @memberof SphProcessSoInitData
     * @static
     * @param {SphProcessSoInitData} message SphProcessSoInitData
     * @param {$protobuf.IConversionOptions} [options] Conversion options
     * @returns {Object.<string,*>} Plain object
     */
    SphProcessSoInitData.toObject = function toObject(message, options) {
        if (!options)
            options = {};
        var object = {};
        if (options.defaults) {
            object.depth = 0;
            object.pid = 0;
            object.tid = 0;
            object.itid = 0;
            if ($util.Long) {
                var long = new $util.Long(0, 0, false);
                object.startTime = options.longs === String ? long.toString() : options.longs === Number ? long.toNumber() : long;
            } else
                object.startTime = options.longs === String ? "0" : 0;
            if ($util.Long) {
                var long = new $util.Long(0, 0, false);
                object.dur = options.longs === String ? long.toString() : options.longs === Number ? long.toNumber() : long;
            } else
                object.dur = options.longs === String ? "0" : 0;
            object.id = 0;
        }
        if (message.depth != null && message.hasOwnProperty("depth"))
            object.depth = message.depth;
        if (message.pid != null && message.hasOwnProperty("pid"))
            object.pid = message.pid;
        if (message.tid != null && message.hasOwnProperty("tid"))
            object.tid = message.tid;
        if (message.itid != null && message.hasOwnProperty("itid"))
            object.itid = message.itid;
        if (message.startTime != null && message.hasOwnProperty("startTime"))
            if (typeof message.startTime === "number")
                object.startTime = options.longs === String ? String(message.startTime) : message.startTime;
            else
                object.startTime = options.longs === String ? $util.Long.prototype.toString.call(message.startTime) : options.longs === Number ? new $util.LongBits(message.startTime.low >>> 0, message.startTime.high >>> 0).toNumber() : message.startTime;
        if (message.dur != null && message.hasOwnProperty("dur"))
            if (typeof message.dur === "number")
                object.dur = options.longs === String ? String(message.dur) : message.dur;
            else
                object.dur = options.longs === String ? $util.Long.prototype.toString.call(message.dur) : options.longs === Number ? new $util.LongBits(message.dur.low >>> 0, message.dur.high >>> 0).toNumber() : message.dur;
        if (message.id != null && message.hasOwnProperty("id"))
            object.id = message.id;
        return object;
    };

    /**
     * Converts this SphProcessSoInitData to JSON.
     * @function toJSON
     * @memberof SphProcessSoInitData
     * @instance
     * @returns {Object.<string,*>} JSON object
     */
    SphProcessSoInitData.prototype.toJSON = function toJSON() {
        return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
    };

    /**
     * Gets the default type url for SphProcessSoInitData
     * @function getTypeUrl
     * @memberof SphProcessSoInitData
     * @static
     * @param {string} [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
     * @returns {string} The default type url
     */
    SphProcessSoInitData.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
        if (typeUrlPrefix === undefined) {
            typeUrlPrefix = "type.googleapis.com";
        }
        return typeUrlPrefix + "/SphProcessSoInitData";
    };

    return SphProcessSoInitData;
})();

$root.SphProcessStartupData = (function() {

    /**
     * Properties of a SphProcessStartupData.
     * @exports ISphProcessStartupData
     * @interface ISphProcessStartupData
     * @property {number|null} [pid] SphProcessStartupData pid
     * @property {number|null} [tid] SphProcessStartupData tid
     * @property {number|null} [itid] SphProcessStartupData itid
     * @property {number|Long|null} [startTime] SphProcessStartupData startTime
     * @property {number|Long|null} [dur] SphProcessStartupData dur
     * @property {number|null} [startName] SphProcessStartupData startName
     */

    /**
     * Constructs a new SphProcessStartupData.
     * @exports SphProcessStartupData
     * @classdesc Represents a SphProcessStartupData.
     * @implements ISphProcessStartupData
     * @constructor
     * @param {ISphProcessStartupData=} [properties] Properties to set
     */
    function SphProcessStartupData(properties) {
        if (properties)
            for (var keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                if (properties[keys[i]] != null)
                    this[keys[i]] = properties[keys[i]];
    }

    /**
     * SphProcessStartupData pid.
     * @member {number} pid
     * @memberof SphProcessStartupData
     * @instance
     */
    SphProcessStartupData.prototype.pid = 0;

    /**
     * SphProcessStartupData tid.
     * @member {number} tid
     * @memberof SphProcessStartupData
     * @instance
     */
    SphProcessStartupData.prototype.tid = 0;

    /**
     * SphProcessStartupData itid.
     * @member {number} itid
     * @memberof SphProcessStartupData
     * @instance
     */
    SphProcessStartupData.prototype.itid = 0;

    /**
     * SphProcessStartupData startTime.
     * @member {number|Long} startTime
     * @memberof SphProcessStartupData
     * @instance
     */
    SphProcessStartupData.prototype.startTime = $util.Long ? $util.Long.fromBits(0,0,false) : 0;

    /**
     * SphProcessStartupData dur.
     * @member {number|Long} dur
     * @memberof SphProcessStartupData
     * @instance
     */
    SphProcessStartupData.prototype.dur = $util.Long ? $util.Long.fromBits(0,0,false) : 0;

    /**
     * SphProcessStartupData startName.
     * @member {number} startName
     * @memberof SphProcessStartupData
     * @instance
     */
    SphProcessStartupData.prototype.startName = 0;

    /**
     * Creates a new SphProcessStartupData instance using the specified properties.
     * @function create
     * @memberof SphProcessStartupData
     * @static
     * @param {ISphProcessStartupData=} [properties] Properties to set
     * @returns {SphProcessStartupData} SphProcessStartupData instance
     */
    SphProcessStartupData.create = function create(properties) {
        return new SphProcessStartupData(properties);
    };

    /**
     * Encodes the specified SphProcessStartupData message. Does not implicitly {@link SphProcessStartupData.verify|verify} messages.
     * @function encode
     * @memberof SphProcessStartupData
     * @static
     * @param {ISphProcessStartupData} message SphProcessStartupData message or plain object to encode
     * @param {$protobuf.Writer} [writer] Writer to encode to
     * @returns {$protobuf.Writer} Writer
     */
    SphProcessStartupData.encode = function encode(message, writer) {
        if (!writer)
            writer = $Writer.create();
        if (message.pid != null && Object.hasOwnProperty.call(message, "pid"))
            writer.uint32(/* id 1, wireType 0 =*/8).int32(message.pid);
        if (message.tid != null && Object.hasOwnProperty.call(message, "tid"))
            writer.uint32(/* id 2, wireType 0 =*/16).int32(message.tid);
        if (message.itid != null && Object.hasOwnProperty.call(message, "itid"))
            writer.uint32(/* id 3, wireType 0 =*/24).int32(message.itid);
        if (message.startTime != null && Object.hasOwnProperty.call(message, "startTime"))
            writer.uint32(/* id 4, wireType 0 =*/32).int64(message.startTime);
        if (message.dur != null && Object.hasOwnProperty.call(message, "dur"))
            writer.uint32(/* id 5, wireType 0 =*/40).int64(message.dur);
        if (message.startName != null && Object.hasOwnProperty.call(message, "startName"))
            writer.uint32(/* id 6, wireType 0 =*/48).int32(message.startName);
        return writer;
    };

    /**
     * Encodes the specified SphProcessStartupData message, length delimited. Does not implicitly {@link SphProcessStartupData.verify|verify} messages.
     * @function encodeDelimited
     * @memberof SphProcessStartupData
     * @static
     * @param {ISphProcessStartupData} message SphProcessStartupData message or plain object to encode
     * @param {$protobuf.Writer} [writer] Writer to encode to
     * @returns {$protobuf.Writer} Writer
     */
    SphProcessStartupData.encodeDelimited = function encodeDelimited(message, writer) {
        return this.encode(message, writer).ldelim();
    };

    /**
     * Decodes a SphProcessStartupData message from the specified reader or buffer.
     * @function decode
     * @memberof SphProcessStartupData
     * @static
     * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
     * @param {number} [length] Message length if known beforehand
     * @returns {SphProcessStartupData} SphProcessStartupData
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    SphProcessStartupData.decode = function decode(reader, length) {
        if (!(reader instanceof $Reader))
            reader = $Reader.create(reader);
        var end = length === undefined ? reader.len : reader.pos + length, message = new $root.SphProcessStartupData();
        while (reader.pos < end) {
            var tag = reader.uint32();
            switch (tag >>> 3) {
            case 1: {
                    message.pid = reader.int32();
                    break;
                }
            case 2: {
                    message.tid = reader.int32();
                    break;
                }
            case 3: {
                    message.itid = reader.int32();
                    break;
                }
            case 4: {
                    message.startTime = reader.int64();
                    break;
                }
            case 5: {
                    message.dur = reader.int64();
                    break;
                }
            case 6: {
                    message.startName = reader.int32();
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
     * Decodes a SphProcessStartupData message from the specified reader or buffer, length delimited.
     * @function decodeDelimited
     * @memberof SphProcessStartupData
     * @static
     * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
     * @returns {SphProcessStartupData} SphProcessStartupData
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    SphProcessStartupData.decodeDelimited = function decodeDelimited(reader) {
        if (!(reader instanceof $Reader))
            reader = new $Reader(reader);
        return this.decode(reader, reader.uint32());
    };

    /**
     * Verifies a SphProcessStartupData message.
     * @function verify
     * @memberof SphProcessStartupData
     * @static
     * @param {Object.<string,*>} message Plain object to verify
     * @returns {string|null} `null` if valid, otherwise the reason why it is not
     */
    SphProcessStartupData.verify = function verify(message) {
        if (typeof message !== "object" || message === null)
            return "object expected";
        if (message.pid != null && message.hasOwnProperty("pid"))
            if (!$util.isInteger(message.pid))
                return "pid: integer expected";
        if (message.tid != null && message.hasOwnProperty("tid"))
            if (!$util.isInteger(message.tid))
                return "tid: integer expected";
        if (message.itid != null && message.hasOwnProperty("itid"))
            if (!$util.isInteger(message.itid))
                return "itid: integer expected";
        if (message.startTime != null && message.hasOwnProperty("startTime"))
            if (!$util.isInteger(message.startTime) && !(message.startTime && $util.isInteger(message.startTime.low) && $util.isInteger(message.startTime.high)))
                return "startTime: integer|Long expected";
        if (message.dur != null && message.hasOwnProperty("dur"))
            if (!$util.isInteger(message.dur) && !(message.dur && $util.isInteger(message.dur.low) && $util.isInteger(message.dur.high)))
                return "dur: integer|Long expected";
        if (message.startName != null && message.hasOwnProperty("startName"))
            if (!$util.isInteger(message.startName))
                return "startName: integer expected";
        return null;
    };

    /**
     * Creates a SphProcessStartupData message from a plain object. Also converts values to their respective internal types.
     * @function fromObject
     * @memberof SphProcessStartupData
     * @static
     * @param {Object.<string,*>} object Plain object
     * @returns {SphProcessStartupData} SphProcessStartupData
     */
    SphProcessStartupData.fromObject = function fromObject(object) {
        if (object instanceof $root.SphProcessStartupData)
            return object;
        var message = new $root.SphProcessStartupData();
        if (object.pid != null)
            message.pid = object.pid | 0;
        if (object.tid != null)
            message.tid = object.tid | 0;
        if (object.itid != null)
            message.itid = object.itid | 0;
        if (object.startTime != null)
            if ($util.Long)
                (message.startTime = $util.Long.fromValue(object.startTime)).unsigned = false;
            else if (typeof object.startTime === "string")
                message.startTime = parseInt(object.startTime, 10);
            else if (typeof object.startTime === "number")
                message.startTime = object.startTime;
            else if (typeof object.startTime === "object")
                message.startTime = new $util.LongBits(object.startTime.low >>> 0, object.startTime.high >>> 0).toNumber();
        if (object.dur != null)
            if ($util.Long)
                (message.dur = $util.Long.fromValue(object.dur)).unsigned = false;
            else if (typeof object.dur === "string")
                message.dur = parseInt(object.dur, 10);
            else if (typeof object.dur === "number")
                message.dur = object.dur;
            else if (typeof object.dur === "object")
                message.dur = new $util.LongBits(object.dur.low >>> 0, object.dur.high >>> 0).toNumber();
        if (object.startName != null)
            message.startName = object.startName | 0;
        return message;
    };

    /**
     * Creates a plain object from a SphProcessStartupData message. Also converts values to other types if specified.
     * @function toObject
     * @memberof SphProcessStartupData
     * @static
     * @param {SphProcessStartupData} message SphProcessStartupData
     * @param {$protobuf.IConversionOptions} [options] Conversion options
     * @returns {Object.<string,*>} Plain object
     */
    SphProcessStartupData.toObject = function toObject(message, options) {
        if (!options)
            options = {};
        var object = {};
        if (options.defaults) {
            object.pid = 0;
            object.tid = 0;
            object.itid = 0;
            if ($util.Long) {
                var long = new $util.Long(0, 0, false);
                object.startTime = options.longs === String ? long.toString() : options.longs === Number ? long.toNumber() : long;
            } else
                object.startTime = options.longs === String ? "0" : 0;
            if ($util.Long) {
                var long = new $util.Long(0, 0, false);
                object.dur = options.longs === String ? long.toString() : options.longs === Number ? long.toNumber() : long;
            } else
                object.dur = options.longs === String ? "0" : 0;
            object.startName = 0;
        }
        if (message.pid != null && message.hasOwnProperty("pid"))
            object.pid = message.pid;
        if (message.tid != null && message.hasOwnProperty("tid"))
            object.tid = message.tid;
        if (message.itid != null && message.hasOwnProperty("itid"))
            object.itid = message.itid;
        if (message.startTime != null && message.hasOwnProperty("startTime"))
            if (typeof message.startTime === "number")
                object.startTime = options.longs === String ? String(message.startTime) : message.startTime;
            else
                object.startTime = options.longs === String ? $util.Long.prototype.toString.call(message.startTime) : options.longs === Number ? new $util.LongBits(message.startTime.low >>> 0, message.startTime.high >>> 0).toNumber() : message.startTime;
        if (message.dur != null && message.hasOwnProperty("dur"))
            if (typeof message.dur === "number")
                object.dur = options.longs === String ? String(message.dur) : message.dur;
            else
                object.dur = options.longs === String ? $util.Long.prototype.toString.call(message.dur) : options.longs === Number ? new $util.LongBits(message.dur.low >>> 0, message.dur.high >>> 0).toNumber() : message.dur;
        if (message.startName != null && message.hasOwnProperty("startName"))
            object.startName = message.startName;
        return object;
    };

    /**
     * Converts this SphProcessStartupData to JSON.
     * @function toJSON
     * @memberof SphProcessStartupData
     * @instance
     * @returns {Object.<string,*>} JSON object
     */
    SphProcessStartupData.prototype.toJSON = function toJSON() {
        return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
    };

    /**
     * Gets the default type url for SphProcessStartupData
     * @function getTypeUrl
     * @memberof SphProcessStartupData
     * @static
     * @param {string} [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
     * @returns {string} The default type url
     */
    SphProcessStartupData.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
        if (typeUrlPrefix === undefined) {
            typeUrlPrefix = "type.googleapis.com";
        }
        return typeUrlPrefix + "/SphProcessStartupData";
    };

    return SphProcessStartupData;
})();

$root.SphClockData = (function() {

    /**
     * Properties of a SphClockData.
     * @exports ISphClockData
     * @interface ISphClockData
     * @property {number|null} [filterId] SphClockData filterId
     * @property {number|null} [value] SphClockData value
     * @property {number|Long|null} [startNs] SphClockData startNs
     */

    /**
     * Constructs a new SphClockData.
     * @exports SphClockData
     * @classdesc Represents a SphClockData.
     * @implements ISphClockData
     * @constructor
     * @param {ISphClockData=} [properties] Properties to set
     */
    function SphClockData(properties) {
        if (properties)
            for (var keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                if (properties[keys[i]] != null)
                    this[keys[i]] = properties[keys[i]];
    }

    /**
     * SphClockData filterId.
     * @member {number} filterId
     * @memberof SphClockData
     * @instance
     */
    SphClockData.prototype.filterId = 0;

    /**
     * SphClockData value.
     * @member {number} value
     * @memberof SphClockData
     * @instance
     */
    SphClockData.prototype.value = 0;

    /**
     * SphClockData startNs.
     * @member {number|Long} startNs
     * @memberof SphClockData
     * @instance
     */
    SphClockData.prototype.startNs = $util.Long ? $util.Long.fromBits(0,0,false) : 0;

    /**
     * Creates a new SphClockData instance using the specified properties.
     * @function create
     * @memberof SphClockData
     * @static
     * @param {ISphClockData=} [properties] Properties to set
     * @returns {SphClockData} SphClockData instance
     */
    SphClockData.create = function create(properties) {
        return new SphClockData(properties);
    };

    /**
     * Encodes the specified SphClockData message. Does not implicitly {@link SphClockData.verify|verify} messages.
     * @function encode
     * @memberof SphClockData
     * @static
     * @param {ISphClockData} message SphClockData message or plain object to encode
     * @param {$protobuf.Writer} [writer] Writer to encode to
     * @returns {$protobuf.Writer} Writer
     */
    SphClockData.encode = function encode(message, writer) {
        if (!writer)
            writer = $Writer.create();
        if (message.filterId != null && Object.hasOwnProperty.call(message, "filterId"))
            writer.uint32(/* id 1, wireType 0 =*/8).int32(message.filterId);
        if (message.value != null && Object.hasOwnProperty.call(message, "value"))
            writer.uint32(/* id 2, wireType 0 =*/16).int32(message.value);
        if (message.startNs != null && Object.hasOwnProperty.call(message, "startNs"))
            writer.uint32(/* id 3, wireType 0 =*/24).int64(message.startNs);
        return writer;
    };

    /**
     * Encodes the specified SphClockData message, length delimited. Does not implicitly {@link SphClockData.verify|verify} messages.
     * @function encodeDelimited
     * @memberof SphClockData
     * @static
     * @param {ISphClockData} message SphClockData message or plain object to encode
     * @param {$protobuf.Writer} [writer] Writer to encode to
     * @returns {$protobuf.Writer} Writer
     */
    SphClockData.encodeDelimited = function encodeDelimited(message, writer) {
        return this.encode(message, writer).ldelim();
    };

    /**
     * Decodes a SphClockData message from the specified reader or buffer.
     * @function decode
     * @memberof SphClockData
     * @static
     * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
     * @param {number} [length] Message length if known beforehand
     * @returns {SphClockData} SphClockData
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    SphClockData.decode = function decode(reader, length) {
        if (!(reader instanceof $Reader))
            reader = $Reader.create(reader);
        var end = length === undefined ? reader.len : reader.pos + length, message = new $root.SphClockData();
        while (reader.pos < end) {
            var tag = reader.uint32();
            switch (tag >>> 3) {
            case 1: {
                    message.filterId = reader.int32();
                    break;
                }
            case 2: {
                    message.value = reader.int32();
                    break;
                }
            case 3: {
                    message.startNs = reader.int64();
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
     * Decodes a SphClockData message from the specified reader or buffer, length delimited.
     * @function decodeDelimited
     * @memberof SphClockData
     * @static
     * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
     * @returns {SphClockData} SphClockData
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    SphClockData.decodeDelimited = function decodeDelimited(reader) {
        if (!(reader instanceof $Reader))
            reader = new $Reader(reader);
        return this.decode(reader, reader.uint32());
    };

    /**
     * Verifies a SphClockData message.
     * @function verify
     * @memberof SphClockData
     * @static
     * @param {Object.<string,*>} message Plain object to verify
     * @returns {string|null} `null` if valid, otherwise the reason why it is not
     */
    SphClockData.verify = function verify(message) {
        if (typeof message !== "object" || message === null)
            return "object expected";
        if (message.filterId != null && message.hasOwnProperty("filterId"))
            if (!$util.isInteger(message.filterId))
                return "filterId: integer expected";
        if (message.value != null && message.hasOwnProperty("value"))
            if (!$util.isInteger(message.value))
                return "value: integer expected";
        if (message.startNs != null && message.hasOwnProperty("startNs"))
            if (!$util.isInteger(message.startNs) && !(message.startNs && $util.isInteger(message.startNs.low) && $util.isInteger(message.startNs.high)))
                return "startNs: integer|Long expected";
        return null;
    };

    /**
     * Creates a SphClockData message from a plain object. Also converts values to their respective internal types.
     * @function fromObject
     * @memberof SphClockData
     * @static
     * @param {Object.<string,*>} object Plain object
     * @returns {SphClockData} SphClockData
     */
    SphClockData.fromObject = function fromObject(object) {
        if (object instanceof $root.SphClockData)
            return object;
        var message = new $root.SphClockData();
        if (object.filterId != null)
            message.filterId = object.filterId | 0;
        if (object.value != null)
            message.value = object.value | 0;
        if (object.startNs != null)
            if ($util.Long)
                (message.startNs = $util.Long.fromValue(object.startNs)).unsigned = false;
            else if (typeof object.startNs === "string")
                message.startNs = parseInt(object.startNs, 10);
            else if (typeof object.startNs === "number")
                message.startNs = object.startNs;
            else if (typeof object.startNs === "object")
                message.startNs = new $util.LongBits(object.startNs.low >>> 0, object.startNs.high >>> 0).toNumber();
        return message;
    };

    /**
     * Creates a plain object from a SphClockData message. Also converts values to other types if specified.
     * @function toObject
     * @memberof SphClockData
     * @static
     * @param {SphClockData} message SphClockData
     * @param {$protobuf.IConversionOptions} [options] Conversion options
     * @returns {Object.<string,*>} Plain object
     */
    SphClockData.toObject = function toObject(message, options) {
        if (!options)
            options = {};
        var object = {};
        if (options.defaults) {
            object.filterId = 0;
            object.value = 0;
            if ($util.Long) {
                var long = new $util.Long(0, 0, false);
                object.startNs = options.longs === String ? long.toString() : options.longs === Number ? long.toNumber() : long;
            } else
                object.startNs = options.longs === String ? "0" : 0;
        }
        if (message.filterId != null && message.hasOwnProperty("filterId"))
            object.filterId = message.filterId;
        if (message.value != null && message.hasOwnProperty("value"))
            object.value = message.value;
        if (message.startNs != null && message.hasOwnProperty("startNs"))
            if (typeof message.startNs === "number")
                object.startNs = options.longs === String ? String(message.startNs) : message.startNs;
            else
                object.startNs = options.longs === String ? $util.Long.prototype.toString.call(message.startNs) : options.longs === Number ? new $util.LongBits(message.startNs.low >>> 0, message.startNs.high >>> 0).toNumber() : message.startNs;
        return object;
    };

    /**
     * Converts this SphClockData to JSON.
     * @function toJSON
     * @memberof SphClockData
     * @instance
     * @returns {Object.<string,*>} JSON object
     */
    SphClockData.prototype.toJSON = function toJSON() {
        return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
    };

    /**
     * Gets the default type url for SphClockData
     * @function getTypeUrl
     * @memberof SphClockData
     * @static
     * @param {string} [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
     * @returns {string} The default type url
     */
    SphClockData.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
        if (typeUrlPrefix === undefined) {
            typeUrlPrefix = "type.googleapis.com";
        }
        return typeUrlPrefix + "/SphClockData";
    };

    return SphClockData;
})();

$root.SphIrqData = (function() {

    /**
     * Properties of a SphIrqData.
     * @exports ISphIrqData
     * @interface ISphIrqData
     * @property {number|Long|null} [startNs] SphIrqData startNs
     * @property {number|Long|null} [dur] SphIrqData dur
     * @property {number|null} [depth] SphIrqData depth
     * @property {number|null} [argSetId] SphIrqData argSetId
     * @property {number|null} [id] SphIrqData id
     */

    /**
     * Constructs a new SphIrqData.
     * @exports SphIrqData
     * @classdesc Represents a SphIrqData.
     * @implements ISphIrqData
     * @constructor
     * @param {ISphIrqData=} [properties] Properties to set
     */
    function SphIrqData(properties) {
        if (properties)
            for (var keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                if (properties[keys[i]] != null)
                    this[keys[i]] = properties[keys[i]];
    }

    /**
     * SphIrqData startNs.
     * @member {number|Long} startNs
     * @memberof SphIrqData
     * @instance
     */
    SphIrqData.prototype.startNs = $util.Long ? $util.Long.fromBits(0,0,false) : 0;

    /**
     * SphIrqData dur.
     * @member {number|Long} dur
     * @memberof SphIrqData
     * @instance
     */
    SphIrqData.prototype.dur = $util.Long ? $util.Long.fromBits(0,0,false) : 0;

    /**
     * SphIrqData depth.
     * @member {number} depth
     * @memberof SphIrqData
     * @instance
     */
    SphIrqData.prototype.depth = 0;

    /**
     * SphIrqData argSetId.
     * @member {number} argSetId
     * @memberof SphIrqData
     * @instance
     */
    SphIrqData.prototype.argSetId = 0;

    /**
     * SphIrqData id.
     * @member {number} id
     * @memberof SphIrqData
     * @instance
     */
    SphIrqData.prototype.id = 0;

    /**
     * Creates a new SphIrqData instance using the specified properties.
     * @function create
     * @memberof SphIrqData
     * @static
     * @param {ISphIrqData=} [properties] Properties to set
     * @returns {SphIrqData} SphIrqData instance
     */
    SphIrqData.create = function create(properties) {
        return new SphIrqData(properties);
    };

    /**
     * Encodes the specified SphIrqData message. Does not implicitly {@link SphIrqData.verify|verify} messages.
     * @function encode
     * @memberof SphIrqData
     * @static
     * @param {ISphIrqData} message SphIrqData message or plain object to encode
     * @param {$protobuf.Writer} [writer] Writer to encode to
     * @returns {$protobuf.Writer} Writer
     */
    SphIrqData.encode = function encode(message, writer) {
        if (!writer)
            writer = $Writer.create();
        if (message.startNs != null && Object.hasOwnProperty.call(message, "startNs"))
            writer.uint32(/* id 1, wireType 0 =*/8).int64(message.startNs);
        if (message.dur != null && Object.hasOwnProperty.call(message, "dur"))
            writer.uint32(/* id 2, wireType 0 =*/16).int64(message.dur);
        if (message.depth != null && Object.hasOwnProperty.call(message, "depth"))
            writer.uint32(/* id 3, wireType 0 =*/24).int32(message.depth);
        if (message.argSetId != null && Object.hasOwnProperty.call(message, "argSetId"))
            writer.uint32(/* id 4, wireType 0 =*/32).int32(message.argSetId);
        if (message.id != null && Object.hasOwnProperty.call(message, "id"))
            writer.uint32(/* id 5, wireType 0 =*/40).int32(message.id);
        return writer;
    };

    /**
     * Encodes the specified SphIrqData message, length delimited. Does not implicitly {@link SphIrqData.verify|verify} messages.
     * @function encodeDelimited
     * @memberof SphIrqData
     * @static
     * @param {ISphIrqData} message SphIrqData message or plain object to encode
     * @param {$protobuf.Writer} [writer] Writer to encode to
     * @returns {$protobuf.Writer} Writer
     */
    SphIrqData.encodeDelimited = function encodeDelimited(message, writer) {
        return this.encode(message, writer).ldelim();
    };

    /**
     * Decodes a SphIrqData message from the specified reader or buffer.
     * @function decode
     * @memberof SphIrqData
     * @static
     * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
     * @param {number} [length] Message length if known beforehand
     * @returns {SphIrqData} SphIrqData
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    SphIrqData.decode = function decode(reader, length) {
        if (!(reader instanceof $Reader))
            reader = $Reader.create(reader);
        var end = length === undefined ? reader.len : reader.pos + length, message = new $root.SphIrqData();
        while (reader.pos < end) {
            var tag = reader.uint32();
            switch (tag >>> 3) {
            case 1: {
                    message.startNs = reader.int64();
                    break;
                }
            case 2: {
                    message.dur = reader.int64();
                    break;
                }
            case 3: {
                    message.depth = reader.int32();
                    break;
                }
            case 4: {
                    message.argSetId = reader.int32();
                    break;
                }
            case 5: {
                    message.id = reader.int32();
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
     * Decodes a SphIrqData message from the specified reader or buffer, length delimited.
     * @function decodeDelimited
     * @memberof SphIrqData
     * @static
     * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
     * @returns {SphIrqData} SphIrqData
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    SphIrqData.decodeDelimited = function decodeDelimited(reader) {
        if (!(reader instanceof $Reader))
            reader = new $Reader(reader);
        return this.decode(reader, reader.uint32());
    };

    /**
     * Verifies a SphIrqData message.
     * @function verify
     * @memberof SphIrqData
     * @static
     * @param {Object.<string,*>} message Plain object to verify
     * @returns {string|null} `null` if valid, otherwise the reason why it is not
     */
    SphIrqData.verify = function verify(message) {
        if (typeof message !== "object" || message === null)
            return "object expected";
        if (message.startNs != null && message.hasOwnProperty("startNs"))
            if (!$util.isInteger(message.startNs) && !(message.startNs && $util.isInteger(message.startNs.low) && $util.isInteger(message.startNs.high)))
                return "startNs: integer|Long expected";
        if (message.dur != null && message.hasOwnProperty("dur"))
            if (!$util.isInteger(message.dur) && !(message.dur && $util.isInteger(message.dur.low) && $util.isInteger(message.dur.high)))
                return "dur: integer|Long expected";
        if (message.depth != null && message.hasOwnProperty("depth"))
            if (!$util.isInteger(message.depth))
                return "depth: integer expected";
        if (message.argSetId != null && message.hasOwnProperty("argSetId"))
            if (!$util.isInteger(message.argSetId))
                return "argSetId: integer expected";
        if (message.id != null && message.hasOwnProperty("id"))
            if (!$util.isInteger(message.id))
                return "id: integer expected";
        return null;
    };

    /**
     * Creates a SphIrqData message from a plain object. Also converts values to their respective internal types.
     * @function fromObject
     * @memberof SphIrqData
     * @static
     * @param {Object.<string,*>} object Plain object
     * @returns {SphIrqData} SphIrqData
     */
    SphIrqData.fromObject = function fromObject(object) {
        if (object instanceof $root.SphIrqData)
            return object;
        var message = new $root.SphIrqData();
        if (object.startNs != null)
            if ($util.Long)
                (message.startNs = $util.Long.fromValue(object.startNs)).unsigned = false;
            else if (typeof object.startNs === "string")
                message.startNs = parseInt(object.startNs, 10);
            else if (typeof object.startNs === "number")
                message.startNs = object.startNs;
            else if (typeof object.startNs === "object")
                message.startNs = new $util.LongBits(object.startNs.low >>> 0, object.startNs.high >>> 0).toNumber();
        if (object.dur != null)
            if ($util.Long)
                (message.dur = $util.Long.fromValue(object.dur)).unsigned = false;
            else if (typeof object.dur === "string")
                message.dur = parseInt(object.dur, 10);
            else if (typeof object.dur === "number")
                message.dur = object.dur;
            else if (typeof object.dur === "object")
                message.dur = new $util.LongBits(object.dur.low >>> 0, object.dur.high >>> 0).toNumber();
        if (object.depth != null)
            message.depth = object.depth | 0;
        if (object.argSetId != null)
            message.argSetId = object.argSetId | 0;
        if (object.id != null)
            message.id = object.id | 0;
        return message;
    };

    /**
     * Creates a plain object from a SphIrqData message. Also converts values to other types if specified.
     * @function toObject
     * @memberof SphIrqData
     * @static
     * @param {SphIrqData} message SphIrqData
     * @param {$protobuf.IConversionOptions} [options] Conversion options
     * @returns {Object.<string,*>} Plain object
     */
    SphIrqData.toObject = function toObject(message, options) {
        if (!options)
            options = {};
        var object = {};
        if (options.defaults) {
            if ($util.Long) {
                var long = new $util.Long(0, 0, false);
                object.startNs = options.longs === String ? long.toString() : options.longs === Number ? long.toNumber() : long;
            } else
                object.startNs = options.longs === String ? "0" : 0;
            if ($util.Long) {
                var long = new $util.Long(0, 0, false);
                object.dur = options.longs === String ? long.toString() : options.longs === Number ? long.toNumber() : long;
            } else
                object.dur = options.longs === String ? "0" : 0;
            object.depth = 0;
            object.argSetId = 0;
            object.id = 0;
        }
        if (message.startNs != null && message.hasOwnProperty("startNs"))
            if (typeof message.startNs === "number")
                object.startNs = options.longs === String ? String(message.startNs) : message.startNs;
            else
                object.startNs = options.longs === String ? $util.Long.prototype.toString.call(message.startNs) : options.longs === Number ? new $util.LongBits(message.startNs.low >>> 0, message.startNs.high >>> 0).toNumber() : message.startNs;
        if (message.dur != null && message.hasOwnProperty("dur"))
            if (typeof message.dur === "number")
                object.dur = options.longs === String ? String(message.dur) : message.dur;
            else
                object.dur = options.longs === String ? $util.Long.prototype.toString.call(message.dur) : options.longs === Number ? new $util.LongBits(message.dur.low >>> 0, message.dur.high >>> 0).toNumber() : message.dur;
        if (message.depth != null && message.hasOwnProperty("depth"))
            object.depth = message.depth;
        if (message.argSetId != null && message.hasOwnProperty("argSetId"))
            object.argSetId = message.argSetId;
        if (message.id != null && message.hasOwnProperty("id"))
            object.id = message.id;
        return object;
    };

    /**
     * Converts this SphIrqData to JSON.
     * @function toJSON
     * @memberof SphIrqData
     * @instance
     * @returns {Object.<string,*>} JSON object
     */
    SphIrqData.prototype.toJSON = function toJSON() {
        return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
    };

    /**
     * Gets the default type url for SphIrqData
     * @function getTypeUrl
     * @memberof SphIrqData
     * @static
     * @param {string} [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
     * @returns {string} The default type url
     */
    SphIrqData.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
        if (typeUrlPrefix === undefined) {
            typeUrlPrefix = "type.googleapis.com";
        }
        return typeUrlPrefix + "/SphIrqData";
    };

    return SphIrqData;
})();

$root.SphHiSysEventData = (function() {

    /**
     * Properties of a SphHiSysEventData.
     * @exports ISphHiSysEventData
     * @interface ISphHiSysEventData
     * @property {number|null} [id] SphHiSysEventData id
     * @property {number|Long|null} [ts] SphHiSysEventData ts
     * @property {number|null} [pid] SphHiSysEventData pid
     * @property {number|null} [tid] SphHiSysEventData tid
     * @property {number|null} [uid] SphHiSysEventData uid
     * @property {string|null} [seq] SphHiSysEventData seq
     * @property {number|null} [depth] SphHiSysEventData depth
     * @property {number|Long|null} [dur] SphHiSysEventData dur
     */

    /**
     * Constructs a new SphHiSysEventData.
     * @exports SphHiSysEventData
     * @classdesc Represents a SphHiSysEventData.
     * @implements ISphHiSysEventData
     * @constructor
     * @param {ISphHiSysEventData=} [properties] Properties to set
     */
    function SphHiSysEventData(properties) {
        if (properties)
            for (var keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                if (properties[keys[i]] != null)
                    this[keys[i]] = properties[keys[i]];
    }

    /**
     * SphHiSysEventData id.
     * @member {number} id
     * @memberof SphHiSysEventData
     * @instance
     */
    SphHiSysEventData.prototype.id = 0;

    /**
     * SphHiSysEventData ts.
     * @member {number|Long} ts
     * @memberof SphHiSysEventData
     * @instance
     */
    SphHiSysEventData.prototype.ts = $util.Long ? $util.Long.fromBits(0,0,false) : 0;

    /**
     * SphHiSysEventData pid.
     * @member {number} pid
     * @memberof SphHiSysEventData
     * @instance
     */
    SphHiSysEventData.prototype.pid = 0;

    /**
     * SphHiSysEventData tid.
     * @member {number} tid
     * @memberof SphHiSysEventData
     * @instance
     */
    SphHiSysEventData.prototype.tid = 0;

    /**
     * SphHiSysEventData uid.
     * @member {number} uid
     * @memberof SphHiSysEventData
     * @instance
     */
    SphHiSysEventData.prototype.uid = 0;

    /**
     * SphHiSysEventData seq.
     * @member {string} seq
     * @memberof SphHiSysEventData
     * @instance
     */
    SphHiSysEventData.prototype.seq = "";

    /**
     * SphHiSysEventData depth.
     * @member {number} depth
     * @memberof SphHiSysEventData
     * @instance
     */
    SphHiSysEventData.prototype.depth = 0;

    /**
     * SphHiSysEventData dur.
     * @member {number|Long} dur
     * @memberof SphHiSysEventData
     * @instance
     */
    SphHiSysEventData.prototype.dur = $util.Long ? $util.Long.fromBits(0,0,false) : 0;

    /**
     * Creates a new SphHiSysEventData instance using the specified properties.
     * @function create
     * @memberof SphHiSysEventData
     * @static
     * @param {ISphHiSysEventData=} [properties] Properties to set
     * @returns {SphHiSysEventData} SphHiSysEventData instance
     */
    SphHiSysEventData.create = function create(properties) {
        return new SphHiSysEventData(properties);
    };

    /**
     * Encodes the specified SphHiSysEventData message. Does not implicitly {@link SphHiSysEventData.verify|verify} messages.
     * @function encode
     * @memberof SphHiSysEventData
     * @static
     * @param {ISphHiSysEventData} message SphHiSysEventData message or plain object to encode
     * @param {$protobuf.Writer} [writer] Writer to encode to
     * @returns {$protobuf.Writer} Writer
     */
    SphHiSysEventData.encode = function encode(message, writer) {
        if (!writer)
            writer = $Writer.create();
        if (message.id != null && Object.hasOwnProperty.call(message, "id"))
            writer.uint32(/* id 1, wireType 0 =*/8).int32(message.id);
        if (message.ts != null && Object.hasOwnProperty.call(message, "ts"))
            writer.uint32(/* id 2, wireType 0 =*/16).int64(message.ts);
        if (message.pid != null && Object.hasOwnProperty.call(message, "pid"))
            writer.uint32(/* id 3, wireType 0 =*/24).int32(message.pid);
        if (message.tid != null && Object.hasOwnProperty.call(message, "tid"))
            writer.uint32(/* id 4, wireType 0 =*/32).int32(message.tid);
        if (message.uid != null && Object.hasOwnProperty.call(message, "uid"))
            writer.uint32(/* id 5, wireType 0 =*/40).int32(message.uid);
        if (message.seq != null && Object.hasOwnProperty.call(message, "seq"))
            writer.uint32(/* id 6, wireType 2 =*/50).string(message.seq);
        if (message.depth != null && Object.hasOwnProperty.call(message, "depth"))
            writer.uint32(/* id 7, wireType 0 =*/56).int32(message.depth);
        if (message.dur != null && Object.hasOwnProperty.call(message, "dur"))
            writer.uint32(/* id 8, wireType 0 =*/64).int64(message.dur);
        return writer;
    };

    /**
     * Encodes the specified SphHiSysEventData message, length delimited. Does not implicitly {@link SphHiSysEventData.verify|verify} messages.
     * @function encodeDelimited
     * @memberof SphHiSysEventData
     * @static
     * @param {ISphHiSysEventData} message SphHiSysEventData message or plain object to encode
     * @param {$protobuf.Writer} [writer] Writer to encode to
     * @returns {$protobuf.Writer} Writer
     */
    SphHiSysEventData.encodeDelimited = function encodeDelimited(message, writer) {
        return this.encode(message, writer).ldelim();
    };

    /**
     * Decodes a SphHiSysEventData message from the specified reader or buffer.
     * @function decode
     * @memberof SphHiSysEventData
     * @static
     * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
     * @param {number} [length] Message length if known beforehand
     * @returns {SphHiSysEventData} SphHiSysEventData
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    SphHiSysEventData.decode = function decode(reader, length) {
        if (!(reader instanceof $Reader))
            reader = $Reader.create(reader);
        var end = length === undefined ? reader.len : reader.pos + length, message = new $root.SphHiSysEventData();
        while (reader.pos < end) {
            var tag = reader.uint32();
            switch (tag >>> 3) {
            case 1: {
                    message.id = reader.int32();
                    break;
                }
            case 2: {
                    message.ts = reader.int64();
                    break;
                }
            case 3: {
                    message.pid = reader.int32();
                    break;
                }
            case 4: {
                    message.tid = reader.int32();
                    break;
                }
            case 5: {
                    message.uid = reader.int32();
                    break;
                }
            case 6: {
                    message.seq = reader.string();
                    break;
                }
            case 7: {
                    message.depth = reader.int32();
                    break;
                }
            case 8: {
                    message.dur = reader.int64();
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
     * Decodes a SphHiSysEventData message from the specified reader or buffer, length delimited.
     * @function decodeDelimited
     * @memberof SphHiSysEventData
     * @static
     * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
     * @returns {SphHiSysEventData} SphHiSysEventData
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    SphHiSysEventData.decodeDelimited = function decodeDelimited(reader) {
        if (!(reader instanceof $Reader))
            reader = new $Reader(reader);
        return this.decode(reader, reader.uint32());
    };

    /**
     * Verifies a SphHiSysEventData message.
     * @function verify
     * @memberof SphHiSysEventData
     * @static
     * @param {Object.<string,*>} message Plain object to verify
     * @returns {string|null} `null` if valid, otherwise the reason why it is not
     */
    SphHiSysEventData.verify = function verify(message) {
        if (typeof message !== "object" || message === null)
            return "object expected";
        if (message.id != null && message.hasOwnProperty("id"))
            if (!$util.isInteger(message.id))
                return "id: integer expected";
        if (message.ts != null && message.hasOwnProperty("ts"))
            if (!$util.isInteger(message.ts) && !(message.ts && $util.isInteger(message.ts.low) && $util.isInteger(message.ts.high)))
                return "ts: integer|Long expected";
        if (message.pid != null && message.hasOwnProperty("pid"))
            if (!$util.isInteger(message.pid))
                return "pid: integer expected";
        if (message.tid != null && message.hasOwnProperty("tid"))
            if (!$util.isInteger(message.tid))
                return "tid: integer expected";
        if (message.uid != null && message.hasOwnProperty("uid"))
            if (!$util.isInteger(message.uid))
                return "uid: integer expected";
        if (message.seq != null && message.hasOwnProperty("seq"))
            if (!$util.isString(message.seq))
                return "seq: string expected";
        if (message.depth != null && message.hasOwnProperty("depth"))
            if (!$util.isInteger(message.depth))
                return "depth: integer expected";
        if (message.dur != null && message.hasOwnProperty("dur"))
            if (!$util.isInteger(message.dur) && !(message.dur && $util.isInteger(message.dur.low) && $util.isInteger(message.dur.high)))
                return "dur: integer|Long expected";
        return null;
    };

    /**
     * Creates a SphHiSysEventData message from a plain object. Also converts values to their respective internal types.
     * @function fromObject
     * @memberof SphHiSysEventData
     * @static
     * @param {Object.<string,*>} object Plain object
     * @returns {SphHiSysEventData} SphHiSysEventData
     */
    SphHiSysEventData.fromObject = function fromObject(object) {
        if (object instanceof $root.SphHiSysEventData)
            return object;
        var message = new $root.SphHiSysEventData();
        if (object.id != null)
            message.id = object.id | 0;
        if (object.ts != null)
            if ($util.Long)
                (message.ts = $util.Long.fromValue(object.ts)).unsigned = false;
            else if (typeof object.ts === "string")
                message.ts = parseInt(object.ts, 10);
            else if (typeof object.ts === "number")
                message.ts = object.ts;
            else if (typeof object.ts === "object")
                message.ts = new $util.LongBits(object.ts.low >>> 0, object.ts.high >>> 0).toNumber();
        if (object.pid != null)
            message.pid = object.pid | 0;
        if (object.tid != null)
            message.tid = object.tid | 0;
        if (object.uid != null)
            message.uid = object.uid | 0;
        if (object.seq != null)
            message.seq = String(object.seq);
        if (object.depth != null)
            message.depth = object.depth | 0;
        if (object.dur != null)
            if ($util.Long)
                (message.dur = $util.Long.fromValue(object.dur)).unsigned = false;
            else if (typeof object.dur === "string")
                message.dur = parseInt(object.dur, 10);
            else if (typeof object.dur === "number")
                message.dur = object.dur;
            else if (typeof object.dur === "object")
                message.dur = new $util.LongBits(object.dur.low >>> 0, object.dur.high >>> 0).toNumber();
        return message;
    };

    /**
     * Creates a plain object from a SphHiSysEventData message. Also converts values to other types if specified.
     * @function toObject
     * @memberof SphHiSysEventData
     * @static
     * @param {SphHiSysEventData} message SphHiSysEventData
     * @param {$protobuf.IConversionOptions} [options] Conversion options
     * @returns {Object.<string,*>} Plain object
     */
    SphHiSysEventData.toObject = function toObject(message, options) {
        if (!options)
            options = {};
        var object = {};
        if (options.defaults) {
            object.id = 0;
            if ($util.Long) {
                var long = new $util.Long(0, 0, false);
                object.ts = options.longs === String ? long.toString() : options.longs === Number ? long.toNumber() : long;
            } else
                object.ts = options.longs === String ? "0" : 0;
            object.pid = 0;
            object.tid = 0;
            object.uid = 0;
            object.seq = "";
            object.depth = 0;
            if ($util.Long) {
                var long = new $util.Long(0, 0, false);
                object.dur = options.longs === String ? long.toString() : options.longs === Number ? long.toNumber() : long;
            } else
                object.dur = options.longs === String ? "0" : 0;
        }
        if (message.id != null && message.hasOwnProperty("id"))
            object.id = message.id;
        if (message.ts != null && message.hasOwnProperty("ts"))
            if (typeof message.ts === "number")
                object.ts = options.longs === String ? String(message.ts) : message.ts;
            else
                object.ts = options.longs === String ? $util.Long.prototype.toString.call(message.ts) : options.longs === Number ? new $util.LongBits(message.ts.low >>> 0, message.ts.high >>> 0).toNumber() : message.ts;
        if (message.pid != null && message.hasOwnProperty("pid"))
            object.pid = message.pid;
        if (message.tid != null && message.hasOwnProperty("tid"))
            object.tid = message.tid;
        if (message.uid != null && message.hasOwnProperty("uid"))
            object.uid = message.uid;
        if (message.seq != null && message.hasOwnProperty("seq"))
            object.seq = message.seq;
        if (message.depth != null && message.hasOwnProperty("depth"))
            object.depth = message.depth;
        if (message.dur != null && message.hasOwnProperty("dur"))
            if (typeof message.dur === "number")
                object.dur = options.longs === String ? String(message.dur) : message.dur;
            else
                object.dur = options.longs === String ? $util.Long.prototype.toString.call(message.dur) : options.longs === Number ? new $util.LongBits(message.dur.low >>> 0, message.dur.high >>> 0).toNumber() : message.dur;
        return object;
    };

    /**
     * Converts this SphHiSysEventData to JSON.
     * @function toJSON
     * @memberof SphHiSysEventData
     * @instance
     * @returns {Object.<string,*>} JSON object
     */
    SphHiSysEventData.prototype.toJSON = function toJSON() {
        return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
    };

    /**
     * Gets the default type url for SphHiSysEventData
     * @function getTypeUrl
     * @memberof SphHiSysEventData
     * @static
     * @param {string} [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
     * @returns {string} The default type url
     */
    SphHiSysEventData.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
        if (typeUrlPrefix === undefined) {
            typeUrlPrefix = "type.googleapis.com";
        }
        return typeUrlPrefix + "/SphHiSysEventData";
    };

    return SphHiSysEventData;
})();

$root.SphLogData = (function() {

    /**
     * Properties of a SphLogData.
     * @exports ISphLogData
     * @interface ISphLogData
     * @property {number|null} [id] SphLogData id
     * @property {number|null} [pid] SphLogData pid
     * @property {number|null} [tid] SphLogData tid
     * @property {number|Long|null} [startTs] SphLogData startTs
     * @property {number|null} [depth] SphLogData depth
     * @property {number|Long|null} [dur] SphLogData dur
     */

    /**
     * Constructs a new SphLogData.
     * @exports SphLogData
     * @classdesc Represents a SphLogData.
     * @implements ISphLogData
     * @constructor
     * @param {ISphLogData=} [properties] Properties to set
     */
    function SphLogData(properties) {
        if (properties)
            for (var keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                if (properties[keys[i]] != null)
                    this[keys[i]] = properties[keys[i]];
    }

    /**
     * SphLogData id.
     * @member {number} id
     * @memberof SphLogData
     * @instance
     */
    SphLogData.prototype.id = 0;

    /**
     * SphLogData pid.
     * @member {number} pid
     * @memberof SphLogData
     * @instance
     */
    SphLogData.prototype.pid = 0;

    /**
     * SphLogData tid.
     * @member {number} tid
     * @memberof SphLogData
     * @instance
     */
    SphLogData.prototype.tid = 0;

    /**
     * SphLogData startTs.
     * @member {number|Long} startTs
     * @memberof SphLogData
     * @instance
     */
    SphLogData.prototype.startTs = $util.Long ? $util.Long.fromBits(0,0,false) : 0;

    /**
     * SphLogData depth.
     * @member {number} depth
     * @memberof SphLogData
     * @instance
     */
    SphLogData.prototype.depth = 0;

    /**
     * SphLogData dur.
     * @member {number|Long} dur
     * @memberof SphLogData
     * @instance
     */
    SphLogData.prototype.dur = $util.Long ? $util.Long.fromBits(0,0,false) : 0;

    /**
     * Creates a new SphLogData instance using the specified properties.
     * @function create
     * @memberof SphLogData
     * @static
     * @param {ISphLogData=} [properties] Properties to set
     * @returns {SphLogData} SphLogData instance
     */
    SphLogData.create = function create(properties) {
        return new SphLogData(properties);
    };

    /**
     * Encodes the specified SphLogData message. Does not implicitly {@link SphLogData.verify|verify} messages.
     * @function encode
     * @memberof SphLogData
     * @static
     * @param {ISphLogData} message SphLogData message or plain object to encode
     * @param {$protobuf.Writer} [writer] Writer to encode to
     * @returns {$protobuf.Writer} Writer
     */
    SphLogData.encode = function encode(message, writer) {
        if (!writer)
            writer = $Writer.create();
        if (message.id != null && Object.hasOwnProperty.call(message, "id"))
            writer.uint32(/* id 1, wireType 0 =*/8).int32(message.id);
        if (message.pid != null && Object.hasOwnProperty.call(message, "pid"))
            writer.uint32(/* id 2, wireType 0 =*/16).int32(message.pid);
        if (message.tid != null && Object.hasOwnProperty.call(message, "tid"))
            writer.uint32(/* id 3, wireType 0 =*/24).int32(message.tid);
        if (message.startTs != null && Object.hasOwnProperty.call(message, "startTs"))
            writer.uint32(/* id 4, wireType 0 =*/32).int64(message.startTs);
        if (message.depth != null && Object.hasOwnProperty.call(message, "depth"))
            writer.uint32(/* id 5, wireType 0 =*/40).int32(message.depth);
        if (message.dur != null && Object.hasOwnProperty.call(message, "dur"))
            writer.uint32(/* id 6, wireType 0 =*/48).int64(message.dur);
        return writer;
    };

    /**
     * Encodes the specified SphLogData message, length delimited. Does not implicitly {@link SphLogData.verify|verify} messages.
     * @function encodeDelimited
     * @memberof SphLogData
     * @static
     * @param {ISphLogData} message SphLogData message or plain object to encode
     * @param {$protobuf.Writer} [writer] Writer to encode to
     * @returns {$protobuf.Writer} Writer
     */
    SphLogData.encodeDelimited = function encodeDelimited(message, writer) {
        return this.encode(message, writer).ldelim();
    };

    /**
     * Decodes a SphLogData message from the specified reader or buffer.
     * @function decode
     * @memberof SphLogData
     * @static
     * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
     * @param {number} [length] Message length if known beforehand
     * @returns {SphLogData} SphLogData
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    SphLogData.decode = function decode(reader, length) {
        if (!(reader instanceof $Reader))
            reader = $Reader.create(reader);
        var end = length === undefined ? reader.len : reader.pos + length, message = new $root.SphLogData();
        while (reader.pos < end) {
            var tag = reader.uint32();
            switch (tag >>> 3) {
            case 1: {
                    message.id = reader.int32();
                    break;
                }
            case 2: {
                    message.pid = reader.int32();
                    break;
                }
            case 3: {
                    message.tid = reader.int32();
                    break;
                }
            case 4: {
                    message.startTs = reader.int64();
                    break;
                }
            case 5: {
                    message.depth = reader.int32();
                    break;
                }
            case 6: {
                    message.dur = reader.int64();
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
     * Decodes a SphLogData message from the specified reader or buffer, length delimited.
     * @function decodeDelimited
     * @memberof SphLogData
     * @static
     * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
     * @returns {SphLogData} SphLogData
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    SphLogData.decodeDelimited = function decodeDelimited(reader) {
        if (!(reader instanceof $Reader))
            reader = new $Reader(reader);
        return this.decode(reader, reader.uint32());
    };

    /**
     * Verifies a SphLogData message.
     * @function verify
     * @memberof SphLogData
     * @static
     * @param {Object.<string,*>} message Plain object to verify
     * @returns {string|null} `null` if valid, otherwise the reason why it is not
     */
    SphLogData.verify = function verify(message) {
        if (typeof message !== "object" || message === null)
            return "object expected";
        if (message.id != null && message.hasOwnProperty("id"))
            if (!$util.isInteger(message.id))
                return "id: integer expected";
        if (message.pid != null && message.hasOwnProperty("pid"))
            if (!$util.isInteger(message.pid))
                return "pid: integer expected";
        if (message.tid != null && message.hasOwnProperty("tid"))
            if (!$util.isInteger(message.tid))
                return "tid: integer expected";
        if (message.startTs != null && message.hasOwnProperty("startTs"))
            if (!$util.isInteger(message.startTs) && !(message.startTs && $util.isInteger(message.startTs.low) && $util.isInteger(message.startTs.high)))
                return "startTs: integer|Long expected";
        if (message.depth != null && message.hasOwnProperty("depth"))
            if (!$util.isInteger(message.depth))
                return "depth: integer expected";
        if (message.dur != null && message.hasOwnProperty("dur"))
            if (!$util.isInteger(message.dur) && !(message.dur && $util.isInteger(message.dur.low) && $util.isInteger(message.dur.high)))
                return "dur: integer|Long expected";
        return null;
    };

    /**
     * Creates a SphLogData message from a plain object. Also converts values to their respective internal types.
     * @function fromObject
     * @memberof SphLogData
     * @static
     * @param {Object.<string,*>} object Plain object
     * @returns {SphLogData} SphLogData
     */
    SphLogData.fromObject = function fromObject(object) {
        if (object instanceof $root.SphLogData)
            return object;
        var message = new $root.SphLogData();
        if (object.id != null)
            message.id = object.id | 0;
        if (object.pid != null)
            message.pid = object.pid | 0;
        if (object.tid != null)
            message.tid = object.tid | 0;
        if (object.startTs != null)
            if ($util.Long)
                (message.startTs = $util.Long.fromValue(object.startTs)).unsigned = false;
            else if (typeof object.startTs === "string")
                message.startTs = parseInt(object.startTs, 10);
            else if (typeof object.startTs === "number")
                message.startTs = object.startTs;
            else if (typeof object.startTs === "object")
                message.startTs = new $util.LongBits(object.startTs.low >>> 0, object.startTs.high >>> 0).toNumber();
        if (object.depth != null)
            message.depth = object.depth | 0;
        if (object.dur != null)
            if ($util.Long)
                (message.dur = $util.Long.fromValue(object.dur)).unsigned = false;
            else if (typeof object.dur === "string")
                message.dur = parseInt(object.dur, 10);
            else if (typeof object.dur === "number")
                message.dur = object.dur;
            else if (typeof object.dur === "object")
                message.dur = new $util.LongBits(object.dur.low >>> 0, object.dur.high >>> 0).toNumber();
        return message;
    };

    /**
     * Creates a plain object from a SphLogData message. Also converts values to other types if specified.
     * @function toObject
     * @memberof SphLogData
     * @static
     * @param {SphLogData} message SphLogData
     * @param {$protobuf.IConversionOptions} [options] Conversion options
     * @returns {Object.<string,*>} Plain object
     */
    SphLogData.toObject = function toObject(message, options) {
        if (!options)
            options = {};
        var object = {};
        if (options.defaults) {
            object.id = 0;
            object.pid = 0;
            object.tid = 0;
            if ($util.Long) {
                var long = new $util.Long(0, 0, false);
                object.startTs = options.longs === String ? long.toString() : options.longs === Number ? long.toNumber() : long;
            } else
                object.startTs = options.longs === String ? "0" : 0;
            object.depth = 0;
            if ($util.Long) {
                var long = new $util.Long(0, 0, false);
                object.dur = options.longs === String ? long.toString() : options.longs === Number ? long.toNumber() : long;
            } else
                object.dur = options.longs === String ? "0" : 0;
        }
        if (message.id != null && message.hasOwnProperty("id"))
            object.id = message.id;
        if (message.pid != null && message.hasOwnProperty("pid"))
            object.pid = message.pid;
        if (message.tid != null && message.hasOwnProperty("tid"))
            object.tid = message.tid;
        if (message.startTs != null && message.hasOwnProperty("startTs"))
            if (typeof message.startTs === "number")
                object.startTs = options.longs === String ? String(message.startTs) : message.startTs;
            else
                object.startTs = options.longs === String ? $util.Long.prototype.toString.call(message.startTs) : options.longs === Number ? new $util.LongBits(message.startTs.low >>> 0, message.startTs.high >>> 0).toNumber() : message.startTs;
        if (message.depth != null && message.hasOwnProperty("depth"))
            object.depth = message.depth;
        if (message.dur != null && message.hasOwnProperty("dur"))
            if (typeof message.dur === "number")
                object.dur = options.longs === String ? String(message.dur) : message.dur;
            else
                object.dur = options.longs === String ? $util.Long.prototype.toString.call(message.dur) : options.longs === Number ? new $util.LongBits(message.dur.low >>> 0, message.dur.high >>> 0).toNumber() : message.dur;
        return object;
    };

    /**
     * Converts this SphLogData to JSON.
     * @function toJSON
     * @memberof SphLogData
     * @instance
     * @returns {Object.<string,*>} JSON object
     */
    SphLogData.prototype.toJSON = function toJSON() {
        return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
    };

    /**
     * Gets the default type url for SphLogData
     * @function getTypeUrl
     * @memberof SphLogData
     * @static
     * @param {string} [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
     * @returns {string} The default type url
     */
    SphLogData.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
        if (typeUrlPrefix === undefined) {
            typeUrlPrefix = "type.googleapis.com";
        }
        return typeUrlPrefix + "/SphLogData";
    };

    return SphLogData;
})();

$root.SphVirtualMemData = (function() {

    /**
     * Properties of a SphVirtualMemData.
     * @exports ISphVirtualMemData
     * @interface ISphVirtualMemData
     * @property {number|Long|null} [startTime] SphVirtualMemData startTime
     * @property {number|null} [filterId] SphVirtualMemData filterId
     * @property {number|Long|null} [value] SphVirtualMemData value
     * @property {number|null} [duration] SphVirtualMemData duration
     * @property {number|Long|null} [maxValue] SphVirtualMemData maxValue
     * @property {number|null} [delta] SphVirtualMemData delta
     */

    /**
     * Constructs a new SphVirtualMemData.
     * @exports SphVirtualMemData
     * @classdesc Represents a SphVirtualMemData.
     * @implements ISphVirtualMemData
     * @constructor
     * @param {ISphVirtualMemData=} [properties] Properties to set
     */
    function SphVirtualMemData(properties) {
        if (properties)
            for (var keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                if (properties[keys[i]] != null)
                    this[keys[i]] = properties[keys[i]];
    }

    /**
     * SphVirtualMemData startTime.
     * @member {number|Long} startTime
     * @memberof SphVirtualMemData
     * @instance
     */
    SphVirtualMemData.prototype.startTime = $util.Long ? $util.Long.fromBits(0,0,false) : 0;

    /**
     * SphVirtualMemData filterId.
     * @member {number} filterId
     * @memberof SphVirtualMemData
     * @instance
     */
    SphVirtualMemData.prototype.filterId = 0;

    /**
     * SphVirtualMemData value.
     * @member {number|Long} value
     * @memberof SphVirtualMemData
     * @instance
     */
    SphVirtualMemData.prototype.value = $util.Long ? $util.Long.fromBits(0,0,false) : 0;

    /**
     * SphVirtualMemData duration.
     * @member {number} duration
     * @memberof SphVirtualMemData
     * @instance
     */
    SphVirtualMemData.prototype.duration = 0;

    /**
     * SphVirtualMemData maxValue.
     * @member {number|Long} maxValue
     * @memberof SphVirtualMemData
     * @instance
     */
    SphVirtualMemData.prototype.maxValue = $util.Long ? $util.Long.fromBits(0,0,false) : 0;

    /**
     * SphVirtualMemData delta.
     * @member {number} delta
     * @memberof SphVirtualMemData
     * @instance
     */
    SphVirtualMemData.prototype.delta = 0;

    /**
     * Creates a new SphVirtualMemData instance using the specified properties.
     * @function create
     * @memberof SphVirtualMemData
     * @static
     * @param {ISphVirtualMemData=} [properties] Properties to set
     * @returns {SphVirtualMemData} SphVirtualMemData instance
     */
    SphVirtualMemData.create = function create(properties) {
        return new SphVirtualMemData(properties);
    };

    /**
     * Encodes the specified SphVirtualMemData message. Does not implicitly {@link SphVirtualMemData.verify|verify} messages.
     * @function encode
     * @memberof SphVirtualMemData
     * @static
     * @param {ISphVirtualMemData} message SphVirtualMemData message or plain object to encode
     * @param {$protobuf.Writer} [writer] Writer to encode to
     * @returns {$protobuf.Writer} Writer
     */
    SphVirtualMemData.encode = function encode(message, writer) {
        if (!writer)
            writer = $Writer.create();
        if (message.startTime != null && Object.hasOwnProperty.call(message, "startTime"))
            writer.uint32(/* id 1, wireType 0 =*/8).int64(message.startTime);
        if (message.filterId != null && Object.hasOwnProperty.call(message, "filterId"))
            writer.uint32(/* id 2, wireType 0 =*/16).int32(message.filterId);
        if (message.value != null && Object.hasOwnProperty.call(message, "value"))
            writer.uint32(/* id 3, wireType 0 =*/24).int64(message.value);
        if (message.duration != null && Object.hasOwnProperty.call(message, "duration"))
            writer.uint32(/* id 4, wireType 0 =*/32).int32(message.duration);
        if (message.maxValue != null && Object.hasOwnProperty.call(message, "maxValue"))
            writer.uint32(/* id 5, wireType 0 =*/40).int64(message.maxValue);
        if (message.delta != null && Object.hasOwnProperty.call(message, "delta"))
            writer.uint32(/* id 6, wireType 0 =*/48).int32(message.delta);
        return writer;
    };

    /**
     * Encodes the specified SphVirtualMemData message, length delimited. Does not implicitly {@link SphVirtualMemData.verify|verify} messages.
     * @function encodeDelimited
     * @memberof SphVirtualMemData
     * @static
     * @param {ISphVirtualMemData} message SphVirtualMemData message or plain object to encode
     * @param {$protobuf.Writer} [writer] Writer to encode to
     * @returns {$protobuf.Writer} Writer
     */
    SphVirtualMemData.encodeDelimited = function encodeDelimited(message, writer) {
        return this.encode(message, writer).ldelim();
    };

    /**
     * Decodes a SphVirtualMemData message from the specified reader or buffer.
     * @function decode
     * @memberof SphVirtualMemData
     * @static
     * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
     * @param {number} [length] Message length if known beforehand
     * @returns {SphVirtualMemData} SphVirtualMemData
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    SphVirtualMemData.decode = function decode(reader, length) {
        if (!(reader instanceof $Reader))
            reader = $Reader.create(reader);
        var end = length === undefined ? reader.len : reader.pos + length, message = new $root.SphVirtualMemData();
        while (reader.pos < end) {
            var tag = reader.uint32();
            switch (tag >>> 3) {
            case 1: {
                    message.startTime = reader.int64();
                    break;
                }
            case 2: {
                    message.filterId = reader.int32();
                    break;
                }
            case 3: {
                    message.value = reader.int64();
                    break;
                }
            case 4: {
                    message.duration = reader.int32();
                    break;
                }
            case 5: {
                    message.maxValue = reader.int64();
                    break;
                }
            case 6: {
                    message.delta = reader.int32();
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
     * Decodes a SphVirtualMemData message from the specified reader or buffer, length delimited.
     * @function decodeDelimited
     * @memberof SphVirtualMemData
     * @static
     * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
     * @returns {SphVirtualMemData} SphVirtualMemData
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    SphVirtualMemData.decodeDelimited = function decodeDelimited(reader) {
        if (!(reader instanceof $Reader))
            reader = new $Reader(reader);
        return this.decode(reader, reader.uint32());
    };

    /**
     * Verifies a SphVirtualMemData message.
     * @function verify
     * @memberof SphVirtualMemData
     * @static
     * @param {Object.<string,*>} message Plain object to verify
     * @returns {string|null} `null` if valid, otherwise the reason why it is not
     */
    SphVirtualMemData.verify = function verify(message) {
        if (typeof message !== "object" || message === null)
            return "object expected";
        if (message.startTime != null && message.hasOwnProperty("startTime"))
            if (!$util.isInteger(message.startTime) && !(message.startTime && $util.isInteger(message.startTime.low) && $util.isInteger(message.startTime.high)))
                return "startTime: integer|Long expected";
        if (message.filterId != null && message.hasOwnProperty("filterId"))
            if (!$util.isInteger(message.filterId))
                return "filterId: integer expected";
        if (message.value != null && message.hasOwnProperty("value"))
            if (!$util.isInteger(message.value) && !(message.value && $util.isInteger(message.value.low) && $util.isInteger(message.value.high)))
                return "value: integer|Long expected";
        if (message.duration != null && message.hasOwnProperty("duration"))
            if (!$util.isInteger(message.duration))
                return "duration: integer expected";
        if (message.maxValue != null && message.hasOwnProperty("maxValue"))
            if (!$util.isInteger(message.maxValue) && !(message.maxValue && $util.isInteger(message.maxValue.low) && $util.isInteger(message.maxValue.high)))
                return "maxValue: integer|Long expected";
        if (message.delta != null && message.hasOwnProperty("delta"))
            if (!$util.isInteger(message.delta))
                return "delta: integer expected";
        return null;
    };

    /**
     * Creates a SphVirtualMemData message from a plain object. Also converts values to their respective internal types.
     * @function fromObject
     * @memberof SphVirtualMemData
     * @static
     * @param {Object.<string,*>} object Plain object
     * @returns {SphVirtualMemData} SphVirtualMemData
     */
    SphVirtualMemData.fromObject = function fromObject(object) {
        if (object instanceof $root.SphVirtualMemData)
            return object;
        var message = new $root.SphVirtualMemData();
        if (object.startTime != null)
            if ($util.Long)
                (message.startTime = $util.Long.fromValue(object.startTime)).unsigned = false;
            else if (typeof object.startTime === "string")
                message.startTime = parseInt(object.startTime, 10);
            else if (typeof object.startTime === "number")
                message.startTime = object.startTime;
            else if (typeof object.startTime === "object")
                message.startTime = new $util.LongBits(object.startTime.low >>> 0, object.startTime.high >>> 0).toNumber();
        if (object.filterId != null)
            message.filterId = object.filterId | 0;
        if (object.value != null)
            if ($util.Long)
                (message.value = $util.Long.fromValue(object.value)).unsigned = false;
            else if (typeof object.value === "string")
                message.value = parseInt(object.value, 10);
            else if (typeof object.value === "number")
                message.value = object.value;
            else if (typeof object.value === "object")
                message.value = new $util.LongBits(object.value.low >>> 0, object.value.high >>> 0).toNumber();
        if (object.duration != null)
            message.duration = object.duration | 0;
        if (object.maxValue != null)
            if ($util.Long)
                (message.maxValue = $util.Long.fromValue(object.maxValue)).unsigned = false;
            else if (typeof object.maxValue === "string")
                message.maxValue = parseInt(object.maxValue, 10);
            else if (typeof object.maxValue === "number")
                message.maxValue = object.maxValue;
            else if (typeof object.maxValue === "object")
                message.maxValue = new $util.LongBits(object.maxValue.low >>> 0, object.maxValue.high >>> 0).toNumber();
        if (object.delta != null)
            message.delta = object.delta | 0;
        return message;
    };

    /**
     * Creates a plain object from a SphVirtualMemData message. Also converts values to other types if specified.
     * @function toObject
     * @memberof SphVirtualMemData
     * @static
     * @param {SphVirtualMemData} message SphVirtualMemData
     * @param {$protobuf.IConversionOptions} [options] Conversion options
     * @returns {Object.<string,*>} Plain object
     */
    SphVirtualMemData.toObject = function toObject(message, options) {
        if (!options)
            options = {};
        var object = {};
        if (options.defaults) {
            if ($util.Long) {
                var long = new $util.Long(0, 0, false);
                object.startTime = options.longs === String ? long.toString() : options.longs === Number ? long.toNumber() : long;
            } else
                object.startTime = options.longs === String ? "0" : 0;
            object.filterId = 0;
            if ($util.Long) {
                var long = new $util.Long(0, 0, false);
                object.value = options.longs === String ? long.toString() : options.longs === Number ? long.toNumber() : long;
            } else
                object.value = options.longs === String ? "0" : 0;
            object.duration = 0;
            if ($util.Long) {
                var long = new $util.Long(0, 0, false);
                object.maxValue = options.longs === String ? long.toString() : options.longs === Number ? long.toNumber() : long;
            } else
                object.maxValue = options.longs === String ? "0" : 0;
            object.delta = 0;
        }
        if (message.startTime != null && message.hasOwnProperty("startTime"))
            if (typeof message.startTime === "number")
                object.startTime = options.longs === String ? String(message.startTime) : message.startTime;
            else
                object.startTime = options.longs === String ? $util.Long.prototype.toString.call(message.startTime) : options.longs === Number ? new $util.LongBits(message.startTime.low >>> 0, message.startTime.high >>> 0).toNumber() : message.startTime;
        if (message.filterId != null && message.hasOwnProperty("filterId"))
            object.filterId = message.filterId;
        if (message.value != null && message.hasOwnProperty("value"))
            if (typeof message.value === "number")
                object.value = options.longs === String ? String(message.value) : message.value;
            else
                object.value = options.longs === String ? $util.Long.prototype.toString.call(message.value) : options.longs === Number ? new $util.LongBits(message.value.low >>> 0, message.value.high >>> 0).toNumber() : message.value;
        if (message.duration != null && message.hasOwnProperty("duration"))
            object.duration = message.duration;
        if (message.maxValue != null && message.hasOwnProperty("maxValue"))
            if (typeof message.maxValue === "number")
                object.maxValue = options.longs === String ? String(message.maxValue) : message.maxValue;
            else
                object.maxValue = options.longs === String ? $util.Long.prototype.toString.call(message.maxValue) : options.longs === Number ? new $util.LongBits(message.maxValue.low >>> 0, message.maxValue.high >>> 0).toNumber() : message.maxValue;
        if (message.delta != null && message.hasOwnProperty("delta"))
            object.delta = message.delta;
        return object;
    };

    /**
     * Converts this SphVirtualMemData to JSON.
     * @function toJSON
     * @memberof SphVirtualMemData
     * @instance
     * @returns {Object.<string,*>} JSON object
     */
    SphVirtualMemData.prototype.toJSON = function toJSON() {
        return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
    };

    /**
     * Gets the default type url for SphVirtualMemData
     * @function getTypeUrl
     * @memberof SphVirtualMemData
     * @static
     * @param {string} [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
     * @returns {string} The default type url
     */
    SphVirtualMemData.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
        if (typeUrlPrefix === undefined) {
            typeUrlPrefix = "type.googleapis.com";
        }
        return typeUrlPrefix + "/SphVirtualMemData";
    };

    return SphVirtualMemData;
})();

$root.SphEnergyData = (function() {

    /**
     * Properties of a SphEnergyData.
     * @exports ISphEnergyData
     * @interface ISphEnergyData
     * @property {number|null} [id] SphEnergyData id
     * @property {number|Long|null} [startNs] SphEnergyData startNs
     * @property {string|null} [eventName] SphEnergyData eventName
     * @property {string|null} [appKey] SphEnergyData appKey
     * @property {string|null} [eventValue] SphEnergyData eventValue
     */

    /**
     * Constructs a new SphEnergyData.
     * @exports SphEnergyData
     * @classdesc Represents a SphEnergyData.
     * @implements ISphEnergyData
     * @constructor
     * @param {ISphEnergyData=} [properties] Properties to set
     */
    function SphEnergyData(properties) {
        if (properties)
            for (var keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                if (properties[keys[i]] != null)
                    this[keys[i]] = properties[keys[i]];
    }

    /**
     * SphEnergyData id.
     * @member {number} id
     * @memberof SphEnergyData
     * @instance
     */
    SphEnergyData.prototype.id = 0;

    /**
     * SphEnergyData startNs.
     * @member {number|Long} startNs
     * @memberof SphEnergyData
     * @instance
     */
    SphEnergyData.prototype.startNs = $util.Long ? $util.Long.fromBits(0,0,false) : 0;

    /**
     * SphEnergyData eventName.
     * @member {string} eventName
     * @memberof SphEnergyData
     * @instance
     */
    SphEnergyData.prototype.eventName = "";

    /**
     * SphEnergyData appKey.
     * @member {string} appKey
     * @memberof SphEnergyData
     * @instance
     */
    SphEnergyData.prototype.appKey = "";

    /**
     * SphEnergyData eventValue.
     * @member {string} eventValue
     * @memberof SphEnergyData
     * @instance
     */
    SphEnergyData.prototype.eventValue = "";

    /**
     * Creates a new SphEnergyData instance using the specified properties.
     * @function create
     * @memberof SphEnergyData
     * @static
     * @param {ISphEnergyData=} [properties] Properties to set
     * @returns {SphEnergyData} SphEnergyData instance
     */
    SphEnergyData.create = function create(properties) {
        return new SphEnergyData(properties);
    };

    /**
     * Encodes the specified SphEnergyData message. Does not implicitly {@link SphEnergyData.verify|verify} messages.
     * @function encode
     * @memberof SphEnergyData
     * @static
     * @param {ISphEnergyData} message SphEnergyData message or plain object to encode
     * @param {$protobuf.Writer} [writer] Writer to encode to
     * @returns {$protobuf.Writer} Writer
     */
    SphEnergyData.encode = function encode(message, writer) {
        if (!writer)
            writer = $Writer.create();
        if (message.id != null && Object.hasOwnProperty.call(message, "id"))
            writer.uint32(/* id 1, wireType 0 =*/8).int32(message.id);
        if (message.startNs != null && Object.hasOwnProperty.call(message, "startNs"))
            writer.uint32(/* id 2, wireType 0 =*/16).int64(message.startNs);
        if (message.eventName != null && Object.hasOwnProperty.call(message, "eventName"))
            writer.uint32(/* id 3, wireType 2 =*/26).string(message.eventName);
        if (message.appKey != null && Object.hasOwnProperty.call(message, "appKey"))
            writer.uint32(/* id 4, wireType 2 =*/34).string(message.appKey);
        if (message.eventValue != null && Object.hasOwnProperty.call(message, "eventValue"))
            writer.uint32(/* id 5, wireType 2 =*/42).string(message.eventValue);
        return writer;
    };

    /**
     * Encodes the specified SphEnergyData message, length delimited. Does not implicitly {@link SphEnergyData.verify|verify} messages.
     * @function encodeDelimited
     * @memberof SphEnergyData
     * @static
     * @param {ISphEnergyData} message SphEnergyData message or plain object to encode
     * @param {$protobuf.Writer} [writer] Writer to encode to
     * @returns {$protobuf.Writer} Writer
     */
    SphEnergyData.encodeDelimited = function encodeDelimited(message, writer) {
        return this.encode(message, writer).ldelim();
    };

    /**
     * Decodes a SphEnergyData message from the specified reader or buffer.
     * @function decode
     * @memberof SphEnergyData
     * @static
     * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
     * @param {number} [length] Message length if known beforehand
     * @returns {SphEnergyData} SphEnergyData
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    SphEnergyData.decode = function decode(reader, length) {
        if (!(reader instanceof $Reader))
            reader = $Reader.create(reader);
        var end = length === undefined ? reader.len : reader.pos + length, message = new $root.SphEnergyData();
        while (reader.pos < end) {
            var tag = reader.uint32();
            switch (tag >>> 3) {
            case 1: {
                    message.id = reader.int32();
                    break;
                }
            case 2: {
                    message.startNs = reader.int64();
                    break;
                }
            case 3: {
                    message.eventName = reader.string();
                    break;
                }
            case 4: {
                    message.appKey = reader.string();
                    break;
                }
            case 5: {
                    message.eventValue = reader.string();
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
     * Decodes a SphEnergyData message from the specified reader or buffer, length delimited.
     * @function decodeDelimited
     * @memberof SphEnergyData
     * @static
     * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
     * @returns {SphEnergyData} SphEnergyData
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    SphEnergyData.decodeDelimited = function decodeDelimited(reader) {
        if (!(reader instanceof $Reader))
            reader = new $Reader(reader);
        return this.decode(reader, reader.uint32());
    };

    /**
     * Verifies a SphEnergyData message.
     * @function verify
     * @memberof SphEnergyData
     * @static
     * @param {Object.<string,*>} message Plain object to verify
     * @returns {string|null} `null` if valid, otherwise the reason why it is not
     */
    SphEnergyData.verify = function verify(message) {
        if (typeof message !== "object" || message === null)
            return "object expected";
        if (message.id != null && message.hasOwnProperty("id"))
            if (!$util.isInteger(message.id))
                return "id: integer expected";
        if (message.startNs != null && message.hasOwnProperty("startNs"))
            if (!$util.isInteger(message.startNs) && !(message.startNs && $util.isInteger(message.startNs.low) && $util.isInteger(message.startNs.high)))
                return "startNs: integer|Long expected";
        if (message.eventName != null && message.hasOwnProperty("eventName"))
            if (!$util.isString(message.eventName))
                return "eventName: string expected";
        if (message.appKey != null && message.hasOwnProperty("appKey"))
            if (!$util.isString(message.appKey))
                return "appKey: string expected";
        if (message.eventValue != null && message.hasOwnProperty("eventValue"))
            if (!$util.isString(message.eventValue))
                return "eventValue: string expected";
        return null;
    };

    /**
     * Creates a SphEnergyData message from a plain object. Also converts values to their respective internal types.
     * @function fromObject
     * @memberof SphEnergyData
     * @static
     * @param {Object.<string,*>} object Plain object
     * @returns {SphEnergyData} SphEnergyData
     */
    SphEnergyData.fromObject = function fromObject(object) {
        if (object instanceof $root.SphEnergyData)
            return object;
        var message = new $root.SphEnergyData();
        if (object.id != null)
            message.id = object.id | 0;
        if (object.startNs != null)
            if ($util.Long)
                (message.startNs = $util.Long.fromValue(object.startNs)).unsigned = false;
            else if (typeof object.startNs === "string")
                message.startNs = parseInt(object.startNs, 10);
            else if (typeof object.startNs === "number")
                message.startNs = object.startNs;
            else if (typeof object.startNs === "object")
                message.startNs = new $util.LongBits(object.startNs.low >>> 0, object.startNs.high >>> 0).toNumber();
        if (object.eventName != null)
            message.eventName = String(object.eventName);
        if (object.appKey != null)
            message.appKey = String(object.appKey);
        if (object.eventValue != null)
            message.eventValue = String(object.eventValue);
        return message;
    };

    /**
     * Creates a plain object from a SphEnergyData message. Also converts values to other types if specified.
     * @function toObject
     * @memberof SphEnergyData
     * @static
     * @param {SphEnergyData} message SphEnergyData
     * @param {$protobuf.IConversionOptions} [options] Conversion options
     * @returns {Object.<string,*>} Plain object
     */
    SphEnergyData.toObject = function toObject(message, options) {
        if (!options)
            options = {};
        var object = {};
        if (options.defaults) {
            object.id = 0;
            if ($util.Long) {
                var long = new $util.Long(0, 0, false);
                object.startNs = options.longs === String ? long.toString() : options.longs === Number ? long.toNumber() : long;
            } else
                object.startNs = options.longs === String ? "0" : 0;
            object.eventName = "";
            object.appKey = "";
            object.eventValue = "";
        }
        if (message.id != null && message.hasOwnProperty("id"))
            object.id = message.id;
        if (message.startNs != null && message.hasOwnProperty("startNs"))
            if (typeof message.startNs === "number")
                object.startNs = options.longs === String ? String(message.startNs) : message.startNs;
            else
                object.startNs = options.longs === String ? $util.Long.prototype.toString.call(message.startNs) : options.longs === Number ? new $util.LongBits(message.startNs.low >>> 0, message.startNs.high >>> 0).toNumber() : message.startNs;
        if (message.eventName != null && message.hasOwnProperty("eventName"))
            object.eventName = message.eventName;
        if (message.appKey != null && message.hasOwnProperty("appKey"))
            object.appKey = message.appKey;
        if (message.eventValue != null && message.hasOwnProperty("eventValue"))
            object.eventValue = message.eventValue;
        return object;
    };

    /**
     * Converts this SphEnergyData to JSON.
     * @function toJSON
     * @memberof SphEnergyData
     * @instance
     * @returns {Object.<string,*>} JSON object
     */
    SphEnergyData.prototype.toJSON = function toJSON() {
        return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
    };

    /**
     * Gets the default type url for SphEnergyData
     * @function getTypeUrl
     * @memberof SphEnergyData
     * @static
     * @param {string} [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
     * @returns {string} The default type url
     */
    SphEnergyData.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
        if (typeUrlPrefix === undefined) {
            typeUrlPrefix = "type.googleapis.com";
        }
        return typeUrlPrefix + "/SphEnergyData";
    };

    return SphEnergyData;
})();

$root.SphFrameData = (function() {

    /**
     * Properties of a SphFrameData.
     * @exports ISphFrameData
     * @interface ISphFrameData
     * @property {number|null} [id] SphFrameData id
     * @property {string|null} [frameType] SphFrameData frameType
     * @property {number|null} [ipid] SphFrameData ipid
     * @property {number|null} [name] SphFrameData name
     * @property {number|Long|null} [appDur] SphFrameData appDur
     * @property {number|Long|null} [dur] SphFrameData dur
     * @property {number|Long|null} [ts] SphFrameData ts
     * @property {string|null} [type] SphFrameData type
     * @property {number|null} [jankTag] SphFrameData jankTag
     * @property {number|null} [pid] SphFrameData pid
     * @property {string|null} [cmdline] SphFrameData cmdline
     * @property {number|Long|null} [rsTs] SphFrameData rsTs
     * @property {number|null} [rsVsync] SphFrameData rsVsync
     * @property {number|Long|null} [rsDur] SphFrameData rsDur
     * @property {number|null} [rsIpid] SphFrameData rsIpid
     * @property {number|null} [rsPid] SphFrameData rsPid
     * @property {number|null} [rsName] SphFrameData rsName
     */

    /**
     * Constructs a new SphFrameData.
     * @exports SphFrameData
     * @classdesc Represents a SphFrameData.
     * @implements ISphFrameData
     * @constructor
     * @param {ISphFrameData=} [properties] Properties to set
     */
    function SphFrameData(properties) {
        if (properties)
            for (var keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                if (properties[keys[i]] != null)
                    this[keys[i]] = properties[keys[i]];
    }

    /**
     * SphFrameData id.
     * @member {number} id
     * @memberof SphFrameData
     * @instance
     */
    SphFrameData.prototype.id = 0;

    /**
     * SphFrameData frameType.
     * @member {string} frameType
     * @memberof SphFrameData
     * @instance
     */
    SphFrameData.prototype.frameType = "";

    /**
     * SphFrameData ipid.
     * @member {number} ipid
     * @memberof SphFrameData
     * @instance
     */
    SphFrameData.prototype.ipid = 0;

    /**
     * SphFrameData name.
     * @member {number} name
     * @memberof SphFrameData
     * @instance
     */
    SphFrameData.prototype.name = 0;

    /**
     * SphFrameData appDur.
     * @member {number|Long} appDur
     * @memberof SphFrameData
     * @instance
     */
    SphFrameData.prototype.appDur = $util.Long ? $util.Long.fromBits(0,0,false) : 0;

    /**
     * SphFrameData dur.
     * @member {number|Long} dur
     * @memberof SphFrameData
     * @instance
     */
    SphFrameData.prototype.dur = $util.Long ? $util.Long.fromBits(0,0,false) : 0;

    /**
     * SphFrameData ts.
     * @member {number|Long} ts
     * @memberof SphFrameData
     * @instance
     */
    SphFrameData.prototype.ts = $util.Long ? $util.Long.fromBits(0,0,false) : 0;

    /**
     * SphFrameData type.
     * @member {string} type
     * @memberof SphFrameData
     * @instance
     */
    SphFrameData.prototype.type = "";

    /**
     * SphFrameData jankTag.
     * @member {number} jankTag
     * @memberof SphFrameData
     * @instance
     */
    SphFrameData.prototype.jankTag = 0;

    /**
     * SphFrameData pid.
     * @member {number} pid
     * @memberof SphFrameData
     * @instance
     */
    SphFrameData.prototype.pid = 0;

    /**
     * SphFrameData cmdline.
     * @member {string} cmdline
     * @memberof SphFrameData
     * @instance
     */
    SphFrameData.prototype.cmdline = "";

    /**
     * SphFrameData rsTs.
     * @member {number|Long} rsTs
     * @memberof SphFrameData
     * @instance
     */
    SphFrameData.prototype.rsTs = $util.Long ? $util.Long.fromBits(0,0,false) : 0;

    /**
     * SphFrameData rsVsync.
     * @member {number} rsVsync
     * @memberof SphFrameData
     * @instance
     */
    SphFrameData.prototype.rsVsync = 0;

    /**
     * SphFrameData rsDur.
     * @member {number|Long} rsDur
     * @memberof SphFrameData
     * @instance
     */
    SphFrameData.prototype.rsDur = $util.Long ? $util.Long.fromBits(0,0,false) : 0;

    /**
     * SphFrameData rsIpid.
     * @member {number} rsIpid
     * @memberof SphFrameData
     * @instance
     */
    SphFrameData.prototype.rsIpid = 0;

    /**
     * SphFrameData rsPid.
     * @member {number} rsPid
     * @memberof SphFrameData
     * @instance
     */
    SphFrameData.prototype.rsPid = 0;

    /**
     * SphFrameData rsName.
     * @member {number} rsName
     * @memberof SphFrameData
     * @instance
     */
    SphFrameData.prototype.rsName = 0;

    /**
     * Creates a new SphFrameData instance using the specified properties.
     * @function create
     * @memberof SphFrameData
     * @static
     * @param {ISphFrameData=} [properties] Properties to set
     * @returns {SphFrameData} SphFrameData instance
     */
    SphFrameData.create = function create(properties) {
        return new SphFrameData(properties);
    };

    /**
     * Encodes the specified SphFrameData message. Does not implicitly {@link SphFrameData.verify|verify} messages.
     * @function encode
     * @memberof SphFrameData
     * @static
     * @param {ISphFrameData} message SphFrameData message or plain object to encode
     * @param {$protobuf.Writer} [writer] Writer to encode to
     * @returns {$protobuf.Writer} Writer
     */
    SphFrameData.encode = function encode(message, writer) {
        if (!writer)
            writer = $Writer.create();
        if (message.id != null && Object.hasOwnProperty.call(message, "id"))
            writer.uint32(/* id 1, wireType 0 =*/8).int32(message.id);
        if (message.frameType != null && Object.hasOwnProperty.call(message, "frameType"))
            writer.uint32(/* id 2, wireType 2 =*/18).string(message.frameType);
        if (message.ipid != null && Object.hasOwnProperty.call(message, "ipid"))
            writer.uint32(/* id 3, wireType 0 =*/24).int32(message.ipid);
        if (message.name != null && Object.hasOwnProperty.call(message, "name"))
            writer.uint32(/* id 4, wireType 0 =*/32).int32(message.name);
        if (message.appDur != null && Object.hasOwnProperty.call(message, "appDur"))
            writer.uint32(/* id 5, wireType 0 =*/40).int64(message.appDur);
        if (message.dur != null && Object.hasOwnProperty.call(message, "dur"))
            writer.uint32(/* id 6, wireType 0 =*/48).int64(message.dur);
        if (message.ts != null && Object.hasOwnProperty.call(message, "ts"))
            writer.uint32(/* id 7, wireType 0 =*/56).int64(message.ts);
        if (message.type != null && Object.hasOwnProperty.call(message, "type"))
            writer.uint32(/* id 8, wireType 2 =*/66).string(message.type);
        if (message.jankTag != null && Object.hasOwnProperty.call(message, "jankTag"))
            writer.uint32(/* id 9, wireType 0 =*/72).int32(message.jankTag);
        if (message.pid != null && Object.hasOwnProperty.call(message, "pid"))
            writer.uint32(/* id 10, wireType 0 =*/80).int32(message.pid);
        if (message.cmdline != null && Object.hasOwnProperty.call(message, "cmdline"))
            writer.uint32(/* id 11, wireType 2 =*/90).string(message.cmdline);
        if (message.rsTs != null && Object.hasOwnProperty.call(message, "rsTs"))
            writer.uint32(/* id 12, wireType 0 =*/96).int64(message.rsTs);
        if (message.rsVsync != null && Object.hasOwnProperty.call(message, "rsVsync"))
            writer.uint32(/* id 13, wireType 0 =*/104).int32(message.rsVsync);
        if (message.rsDur != null && Object.hasOwnProperty.call(message, "rsDur"))
            writer.uint32(/* id 14, wireType 0 =*/112).int64(message.rsDur);
        if (message.rsIpid != null && Object.hasOwnProperty.call(message, "rsIpid"))
            writer.uint32(/* id 15, wireType 0 =*/120).int32(message.rsIpid);
        if (message.rsPid != null && Object.hasOwnProperty.call(message, "rsPid"))
            writer.uint32(/* id 16, wireType 0 =*/128).int32(message.rsPid);
        if (message.rsName != null && Object.hasOwnProperty.call(message, "rsName"))
            writer.uint32(/* id 17, wireType 0 =*/136).int32(message.rsName);
        return writer;
    };

    /**
     * Encodes the specified SphFrameData message, length delimited. Does not implicitly {@link SphFrameData.verify|verify} messages.
     * @function encodeDelimited
     * @memberof SphFrameData
     * @static
     * @param {ISphFrameData} message SphFrameData message or plain object to encode
     * @param {$protobuf.Writer} [writer] Writer to encode to
     * @returns {$protobuf.Writer} Writer
     */
    SphFrameData.encodeDelimited = function encodeDelimited(message, writer) {
        return this.encode(message, writer).ldelim();
    };

    /**
     * Decodes a SphFrameData message from the specified reader or buffer.
     * @function decode
     * @memberof SphFrameData
     * @static
     * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
     * @param {number} [length] Message length if known beforehand
     * @returns {SphFrameData} SphFrameData
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    SphFrameData.decode = function decode(reader, length) {
        if (!(reader instanceof $Reader))
            reader = $Reader.create(reader);
        var end = length === undefined ? reader.len : reader.pos + length, message = new $root.SphFrameData();
        while (reader.pos < end) {
            var tag = reader.uint32();
            switch (tag >>> 3) {
            case 1: {
                    message.id = reader.int32();
                    break;
                }
            case 2: {
                    message.frameType = reader.string();
                    break;
                }
            case 3: {
                    message.ipid = reader.int32();
                    break;
                }
            case 4: {
                    message.name = reader.int32();
                    break;
                }
            case 5: {
                    message.appDur = reader.int64();
                    break;
                }
            case 6: {
                    message.dur = reader.int64();
                    break;
                }
            case 7: {
                    message.ts = reader.int64();
                    break;
                }
            case 8: {
                    message.type = reader.string();
                    break;
                }
            case 9: {
                    message.jankTag = reader.int32();
                    break;
                }
            case 10: {
                    message.pid = reader.int32();
                    break;
                }
            case 11: {
                    message.cmdline = reader.string();
                    break;
                }
            case 12: {
                    message.rsTs = reader.int64();
                    break;
                }
            case 13: {
                    message.rsVsync = reader.int32();
                    break;
                }
            case 14: {
                    message.rsDur = reader.int64();
                    break;
                }
            case 15: {
                    message.rsIpid = reader.int32();
                    break;
                }
            case 16: {
                    message.rsPid = reader.int32();
                    break;
                }
            case 17: {
                    message.rsName = reader.int32();
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
     * Decodes a SphFrameData message from the specified reader or buffer, length delimited.
     * @function decodeDelimited
     * @memberof SphFrameData
     * @static
     * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
     * @returns {SphFrameData} SphFrameData
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    SphFrameData.decodeDelimited = function decodeDelimited(reader) {
        if (!(reader instanceof $Reader))
            reader = new $Reader(reader);
        return this.decode(reader, reader.uint32());
    };

    /**
     * Verifies a SphFrameData message.
     * @function verify
     * @memberof SphFrameData
     * @static
     * @param {Object.<string,*>} message Plain object to verify
     * @returns {string|null} `null` if valid, otherwise the reason why it is not
     */
    SphFrameData.verify = function verify(message) {
        if (typeof message !== "object" || message === null)
            return "object expected";
        if (message.id != null && message.hasOwnProperty("id"))
            if (!$util.isInteger(message.id))
                return "id: integer expected";
        if (message.frameType != null && message.hasOwnProperty("frameType"))
            if (!$util.isString(message.frameType))
                return "frameType: string expected";
        if (message.ipid != null && message.hasOwnProperty("ipid"))
            if (!$util.isInteger(message.ipid))
                return "ipid: integer expected";
        if (message.name != null && message.hasOwnProperty("name"))
            if (!$util.isInteger(message.name))
                return "name: integer expected";
        if (message.appDur != null && message.hasOwnProperty("appDur"))
            if (!$util.isInteger(message.appDur) && !(message.appDur && $util.isInteger(message.appDur.low) && $util.isInteger(message.appDur.high)))
                return "appDur: integer|Long expected";
        if (message.dur != null && message.hasOwnProperty("dur"))
            if (!$util.isInteger(message.dur) && !(message.dur && $util.isInteger(message.dur.low) && $util.isInteger(message.dur.high)))
                return "dur: integer|Long expected";
        if (message.ts != null && message.hasOwnProperty("ts"))
            if (!$util.isInteger(message.ts) && !(message.ts && $util.isInteger(message.ts.low) && $util.isInteger(message.ts.high)))
                return "ts: integer|Long expected";
        if (message.type != null && message.hasOwnProperty("type"))
            if (!$util.isString(message.type))
                return "type: string expected";
        if (message.jankTag != null && message.hasOwnProperty("jankTag"))
            if (!$util.isInteger(message.jankTag))
                return "jankTag: integer expected";
        if (message.pid != null && message.hasOwnProperty("pid"))
            if (!$util.isInteger(message.pid))
                return "pid: integer expected";
        if (message.cmdline != null && message.hasOwnProperty("cmdline"))
            if (!$util.isString(message.cmdline))
                return "cmdline: string expected";
        if (message.rsTs != null && message.hasOwnProperty("rsTs"))
            if (!$util.isInteger(message.rsTs) && !(message.rsTs && $util.isInteger(message.rsTs.low) && $util.isInteger(message.rsTs.high)))
                return "rsTs: integer|Long expected";
        if (message.rsVsync != null && message.hasOwnProperty("rsVsync"))
            if (!$util.isInteger(message.rsVsync))
                return "rsVsync: integer expected";
        if (message.rsDur != null && message.hasOwnProperty("rsDur"))
            if (!$util.isInteger(message.rsDur) && !(message.rsDur && $util.isInteger(message.rsDur.low) && $util.isInteger(message.rsDur.high)))
                return "rsDur: integer|Long expected";
        if (message.rsIpid != null && message.hasOwnProperty("rsIpid"))
            if (!$util.isInteger(message.rsIpid))
                return "rsIpid: integer expected";
        if (message.rsPid != null && message.hasOwnProperty("rsPid"))
            if (!$util.isInteger(message.rsPid))
                return "rsPid: integer expected";
        if (message.rsName != null && message.hasOwnProperty("rsName"))
            if (!$util.isInteger(message.rsName))
                return "rsName: integer expected";
        return null;
    };

    /**
     * Creates a SphFrameData message from a plain object. Also converts values to their respective internal types.
     * @function fromObject
     * @memberof SphFrameData
     * @static
     * @param {Object.<string,*>} object Plain object
     * @returns {SphFrameData} SphFrameData
     */
    SphFrameData.fromObject = function fromObject(object) {
        if (object instanceof $root.SphFrameData)
            return object;
        var message = new $root.SphFrameData();
        if (object.id != null)
            message.id = object.id | 0;
        if (object.frameType != null)
            message.frameType = String(object.frameType);
        if (object.ipid != null)
            message.ipid = object.ipid | 0;
        if (object.name != null)
            message.name = object.name | 0;
        if (object.appDur != null)
            if ($util.Long)
                (message.appDur = $util.Long.fromValue(object.appDur)).unsigned = false;
            else if (typeof object.appDur === "string")
                message.appDur = parseInt(object.appDur, 10);
            else if (typeof object.appDur === "number")
                message.appDur = object.appDur;
            else if (typeof object.appDur === "object")
                message.appDur = new $util.LongBits(object.appDur.low >>> 0, object.appDur.high >>> 0).toNumber();
        if (object.dur != null)
            if ($util.Long)
                (message.dur = $util.Long.fromValue(object.dur)).unsigned = false;
            else if (typeof object.dur === "string")
                message.dur = parseInt(object.dur, 10);
            else if (typeof object.dur === "number")
                message.dur = object.dur;
            else if (typeof object.dur === "object")
                message.dur = new $util.LongBits(object.dur.low >>> 0, object.dur.high >>> 0).toNumber();
        if (object.ts != null)
            if ($util.Long)
                (message.ts = $util.Long.fromValue(object.ts)).unsigned = false;
            else if (typeof object.ts === "string")
                message.ts = parseInt(object.ts, 10);
            else if (typeof object.ts === "number")
                message.ts = object.ts;
            else if (typeof object.ts === "object")
                message.ts = new $util.LongBits(object.ts.low >>> 0, object.ts.high >>> 0).toNumber();
        if (object.type != null)
            message.type = String(object.type);
        if (object.jankTag != null)
            message.jankTag = object.jankTag | 0;
        if (object.pid != null)
            message.pid = object.pid | 0;
        if (object.cmdline != null)
            message.cmdline = String(object.cmdline);
        if (object.rsTs != null)
            if ($util.Long)
                (message.rsTs = $util.Long.fromValue(object.rsTs)).unsigned = false;
            else if (typeof object.rsTs === "string")
                message.rsTs = parseInt(object.rsTs, 10);
            else if (typeof object.rsTs === "number")
                message.rsTs = object.rsTs;
            else if (typeof object.rsTs === "object")
                message.rsTs = new $util.LongBits(object.rsTs.low >>> 0, object.rsTs.high >>> 0).toNumber();
        if (object.rsVsync != null)
            message.rsVsync = object.rsVsync | 0;
        if (object.rsDur != null)
            if ($util.Long)
                (message.rsDur = $util.Long.fromValue(object.rsDur)).unsigned = false;
            else if (typeof object.rsDur === "string")
                message.rsDur = parseInt(object.rsDur, 10);
            else if (typeof object.rsDur === "number")
                message.rsDur = object.rsDur;
            else if (typeof object.rsDur === "object")
                message.rsDur = new $util.LongBits(object.rsDur.low >>> 0, object.rsDur.high >>> 0).toNumber();
        if (object.rsIpid != null)
            message.rsIpid = object.rsIpid | 0;
        if (object.rsPid != null)
            message.rsPid = object.rsPid | 0;
        if (object.rsName != null)
            message.rsName = object.rsName | 0;
        return message;
    };

    /**
     * Creates a plain object from a SphFrameData message. Also converts values to other types if specified.
     * @function toObject
     * @memberof SphFrameData
     * @static
     * @param {SphFrameData} message SphFrameData
     * @param {$protobuf.IConversionOptions} [options] Conversion options
     * @returns {Object.<string,*>} Plain object
     */
    SphFrameData.toObject = function toObject(message, options) {
        if (!options)
            options = {};
        var object = {};
        if (options.defaults) {
            object.id = 0;
            object.frameType = "";
            object.ipid = 0;
            object.name = 0;
            if ($util.Long) {
                var long = new $util.Long(0, 0, false);
                object.appDur = options.longs === String ? long.toString() : options.longs === Number ? long.toNumber() : long;
            } else
                object.appDur = options.longs === String ? "0" : 0;
            if ($util.Long) {
                var long = new $util.Long(0, 0, false);
                object.dur = options.longs === String ? long.toString() : options.longs === Number ? long.toNumber() : long;
            } else
                object.dur = options.longs === String ? "0" : 0;
            if ($util.Long) {
                var long = new $util.Long(0, 0, false);
                object.ts = options.longs === String ? long.toString() : options.longs === Number ? long.toNumber() : long;
            } else
                object.ts = options.longs === String ? "0" : 0;
            object.type = "";
            object.jankTag = 0;
            object.pid = 0;
            object.cmdline = "";
            if ($util.Long) {
                var long = new $util.Long(0, 0, false);
                object.rsTs = options.longs === String ? long.toString() : options.longs === Number ? long.toNumber() : long;
            } else
                object.rsTs = options.longs === String ? "0" : 0;
            object.rsVsync = 0;
            if ($util.Long) {
                var long = new $util.Long(0, 0, false);
                object.rsDur = options.longs === String ? long.toString() : options.longs === Number ? long.toNumber() : long;
            } else
                object.rsDur = options.longs === String ? "0" : 0;
            object.rsIpid = 0;
            object.rsPid = 0;
            object.rsName = 0;
        }
        if (message.id != null && message.hasOwnProperty("id"))
            object.id = message.id;
        if (message.frameType != null && message.hasOwnProperty("frameType"))
            object.frameType = message.frameType;
        if (message.ipid != null && message.hasOwnProperty("ipid"))
            object.ipid = message.ipid;
        if (message.name != null && message.hasOwnProperty("name"))
            object.name = message.name;
        if (message.appDur != null && message.hasOwnProperty("appDur"))
            if (typeof message.appDur === "number")
                object.appDur = options.longs === String ? String(message.appDur) : message.appDur;
            else
                object.appDur = options.longs === String ? $util.Long.prototype.toString.call(message.appDur) : options.longs === Number ? new $util.LongBits(message.appDur.low >>> 0, message.appDur.high >>> 0).toNumber() : message.appDur;
        if (message.dur != null && message.hasOwnProperty("dur"))
            if (typeof message.dur === "number")
                object.dur = options.longs === String ? String(message.dur) : message.dur;
            else
                object.dur = options.longs === String ? $util.Long.prototype.toString.call(message.dur) : options.longs === Number ? new $util.LongBits(message.dur.low >>> 0, message.dur.high >>> 0).toNumber() : message.dur;
        if (message.ts != null && message.hasOwnProperty("ts"))
            if (typeof message.ts === "number")
                object.ts = options.longs === String ? String(message.ts) : message.ts;
            else
                object.ts = options.longs === String ? $util.Long.prototype.toString.call(message.ts) : options.longs === Number ? new $util.LongBits(message.ts.low >>> 0, message.ts.high >>> 0).toNumber() : message.ts;
        if (message.type != null && message.hasOwnProperty("type"))
            object.type = message.type;
        if (message.jankTag != null && message.hasOwnProperty("jankTag"))
            object.jankTag = message.jankTag;
        if (message.pid != null && message.hasOwnProperty("pid"))
            object.pid = message.pid;
        if (message.cmdline != null && message.hasOwnProperty("cmdline"))
            object.cmdline = message.cmdline;
        if (message.rsTs != null && message.hasOwnProperty("rsTs"))
            if (typeof message.rsTs === "number")
                object.rsTs = options.longs === String ? String(message.rsTs) : message.rsTs;
            else
                object.rsTs = options.longs === String ? $util.Long.prototype.toString.call(message.rsTs) : options.longs === Number ? new $util.LongBits(message.rsTs.low >>> 0, message.rsTs.high >>> 0).toNumber() : message.rsTs;
        if (message.rsVsync != null && message.hasOwnProperty("rsVsync"))
            object.rsVsync = message.rsVsync;
        if (message.rsDur != null && message.hasOwnProperty("rsDur"))
            if (typeof message.rsDur === "number")
                object.rsDur = options.longs === String ? String(message.rsDur) : message.rsDur;
            else
                object.rsDur = options.longs === String ? $util.Long.prototype.toString.call(message.rsDur) : options.longs === Number ? new $util.LongBits(message.rsDur.low >>> 0, message.rsDur.high >>> 0).toNumber() : message.rsDur;
        if (message.rsIpid != null && message.hasOwnProperty("rsIpid"))
            object.rsIpid = message.rsIpid;
        if (message.rsPid != null && message.hasOwnProperty("rsPid"))
            object.rsPid = message.rsPid;
        if (message.rsName != null && message.hasOwnProperty("rsName"))
            object.rsName = message.rsName;
        return object;
    };

    /**
     * Converts this SphFrameData to JSON.
     * @function toJSON
     * @memberof SphFrameData
     * @instance
     * @returns {Object.<string,*>} JSON object
     */
    SphFrameData.prototype.toJSON = function toJSON() {
        return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
    };

    /**
     * Gets the default type url for SphFrameData
     * @function getTypeUrl
     * @memberof SphFrameData
     * @static
     * @param {string} [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
     * @returns {string} The default type url
     */
    SphFrameData.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
        if (typeUrlPrefix === undefined) {
            typeUrlPrefix = "type.googleapis.com";
        }
        return typeUrlPrefix + "/SphFrameData";
    };

    return SphFrameData;
})();

$root.SphFrameAnimationData = (function() {

    /**
     * Properties of a SphFrameAnimationData.
     * @exports ISphFrameAnimationData
     * @interface ISphFrameAnimationData
     * @property {number|null} [animationId] SphFrameAnimationData animationId
     * @property {number|null} [status] SphFrameAnimationData status
     * @property {number|Long|null} [startTs] SphFrameAnimationData startTs
     * @property {number|Long|null} [endTs] SphFrameAnimationData endTs
     * @property {string|null} [name] SphFrameAnimationData name
     */

    /**
     * Constructs a new SphFrameAnimationData.
     * @exports SphFrameAnimationData
     * @classdesc Represents a SphFrameAnimationData.
     * @implements ISphFrameAnimationData
     * @constructor
     * @param {ISphFrameAnimationData=} [properties] Properties to set
     */
    function SphFrameAnimationData(properties) {
        if (properties)
            for (var keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                if (properties[keys[i]] != null)
                    this[keys[i]] = properties[keys[i]];
    }

    /**
     * SphFrameAnimationData animationId.
     * @member {number} animationId
     * @memberof SphFrameAnimationData
     * @instance
     */
    SphFrameAnimationData.prototype.animationId = 0;

    /**
     * SphFrameAnimationData status.
     * @member {number} status
     * @memberof SphFrameAnimationData
     * @instance
     */
    SphFrameAnimationData.prototype.status = 0;

    /**
     * SphFrameAnimationData startTs.
     * @member {number|Long} startTs
     * @memberof SphFrameAnimationData
     * @instance
     */
    SphFrameAnimationData.prototype.startTs = $util.Long ? $util.Long.fromBits(0,0,false) : 0;

    /**
     * SphFrameAnimationData endTs.
     * @member {number|Long} endTs
     * @memberof SphFrameAnimationData
     * @instance
     */
    SphFrameAnimationData.prototype.endTs = $util.Long ? $util.Long.fromBits(0,0,false) : 0;

    /**
     * SphFrameAnimationData name.
     * @member {string} name
     * @memberof SphFrameAnimationData
     * @instance
     */
    SphFrameAnimationData.prototype.name = "";

    /**
     * Creates a new SphFrameAnimationData instance using the specified properties.
     * @function create
     * @memberof SphFrameAnimationData
     * @static
     * @param {ISphFrameAnimationData=} [properties] Properties to set
     * @returns {SphFrameAnimationData} SphFrameAnimationData instance
     */
    SphFrameAnimationData.create = function create(properties) {
        return new SphFrameAnimationData(properties);
    };

    /**
     * Encodes the specified SphFrameAnimationData message. Does not implicitly {@link SphFrameAnimationData.verify|verify} messages.
     * @function encode
     * @memberof SphFrameAnimationData
     * @static
     * @param {ISphFrameAnimationData} message SphFrameAnimationData message or plain object to encode
     * @param {$protobuf.Writer} [writer] Writer to encode to
     * @returns {$protobuf.Writer} Writer
     */
    SphFrameAnimationData.encode = function encode(message, writer) {
        if (!writer)
            writer = $Writer.create();
        if (message.animationId != null && Object.hasOwnProperty.call(message, "animationId"))
            writer.uint32(/* id 1, wireType 0 =*/8).int32(message.animationId);
        if (message.status != null && Object.hasOwnProperty.call(message, "status"))
            writer.uint32(/* id 2, wireType 0 =*/16).int32(message.status);
        if (message.startTs != null && Object.hasOwnProperty.call(message, "startTs"))
            writer.uint32(/* id 3, wireType 0 =*/24).int64(message.startTs);
        if (message.endTs != null && Object.hasOwnProperty.call(message, "endTs"))
            writer.uint32(/* id 4, wireType 0 =*/32).int64(message.endTs);
        if (message.name != null && Object.hasOwnProperty.call(message, "name"))
            writer.uint32(/* id 5, wireType 2 =*/42).string(message.name);
        return writer;
    };

    /**
     * Encodes the specified SphFrameAnimationData message, length delimited. Does not implicitly {@link SphFrameAnimationData.verify|verify} messages.
     * @function encodeDelimited
     * @memberof SphFrameAnimationData
     * @static
     * @param {ISphFrameAnimationData} message SphFrameAnimationData message or plain object to encode
     * @param {$protobuf.Writer} [writer] Writer to encode to
     * @returns {$protobuf.Writer} Writer
     */
    SphFrameAnimationData.encodeDelimited = function encodeDelimited(message, writer) {
        return this.encode(message, writer).ldelim();
    };

    /**
     * Decodes a SphFrameAnimationData message from the specified reader or buffer.
     * @function decode
     * @memberof SphFrameAnimationData
     * @static
     * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
     * @param {number} [length] Message length if known beforehand
     * @returns {SphFrameAnimationData} SphFrameAnimationData
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    SphFrameAnimationData.decode = function decode(reader, length) {
        if (!(reader instanceof $Reader))
            reader = $Reader.create(reader);
        var end = length === undefined ? reader.len : reader.pos + length, message = new $root.SphFrameAnimationData();
        while (reader.pos < end) {
            var tag = reader.uint32();
            switch (tag >>> 3) {
            case 1: {
                    message.animationId = reader.int32();
                    break;
                }
            case 2: {
                    message.status = reader.int32();
                    break;
                }
            case 3: {
                    message.startTs = reader.int64();
                    break;
                }
            case 4: {
                    message.endTs = reader.int64();
                    break;
                }
            case 5: {
                    message.name = reader.string();
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
     * Decodes a SphFrameAnimationData message from the specified reader or buffer, length delimited.
     * @function decodeDelimited
     * @memberof SphFrameAnimationData
     * @static
     * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
     * @returns {SphFrameAnimationData} SphFrameAnimationData
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    SphFrameAnimationData.decodeDelimited = function decodeDelimited(reader) {
        if (!(reader instanceof $Reader))
            reader = new $Reader(reader);
        return this.decode(reader, reader.uint32());
    };

    /**
     * Verifies a SphFrameAnimationData message.
     * @function verify
     * @memberof SphFrameAnimationData
     * @static
     * @param {Object.<string,*>} message Plain object to verify
     * @returns {string|null} `null` if valid, otherwise the reason why it is not
     */
    SphFrameAnimationData.verify = function verify(message) {
        if (typeof message !== "object" || message === null)
            return "object expected";
        if (message.animationId != null && message.hasOwnProperty("animationId"))
            if (!$util.isInteger(message.animationId))
                return "animationId: integer expected";
        if (message.status != null && message.hasOwnProperty("status"))
            if (!$util.isInteger(message.status))
                return "status: integer expected";
        if (message.startTs != null && message.hasOwnProperty("startTs"))
            if (!$util.isInteger(message.startTs) && !(message.startTs && $util.isInteger(message.startTs.low) && $util.isInteger(message.startTs.high)))
                return "startTs: integer|Long expected";
        if (message.endTs != null && message.hasOwnProperty("endTs"))
            if (!$util.isInteger(message.endTs) && !(message.endTs && $util.isInteger(message.endTs.low) && $util.isInteger(message.endTs.high)))
                return "endTs: integer|Long expected";
        if (message.name != null && message.hasOwnProperty("name"))
            if (!$util.isString(message.name))
                return "name: string expected";
        return null;
    };

    /**
     * Creates a SphFrameAnimationData message from a plain object. Also converts values to their respective internal types.
     * @function fromObject
     * @memberof SphFrameAnimationData
     * @static
     * @param {Object.<string,*>} object Plain object
     * @returns {SphFrameAnimationData} SphFrameAnimationData
     */
    SphFrameAnimationData.fromObject = function fromObject(object) {
        if (object instanceof $root.SphFrameAnimationData)
            return object;
        var message = new $root.SphFrameAnimationData();
        if (object.animationId != null)
            message.animationId = object.animationId | 0;
        if (object.status != null)
            message.status = object.status | 0;
        if (object.startTs != null)
            if ($util.Long)
                (message.startTs = $util.Long.fromValue(object.startTs)).unsigned = false;
            else if (typeof object.startTs === "string")
                message.startTs = parseInt(object.startTs, 10);
            else if (typeof object.startTs === "number")
                message.startTs = object.startTs;
            else if (typeof object.startTs === "object")
                message.startTs = new $util.LongBits(object.startTs.low >>> 0, object.startTs.high >>> 0).toNumber();
        if (object.endTs != null)
            if ($util.Long)
                (message.endTs = $util.Long.fromValue(object.endTs)).unsigned = false;
            else if (typeof object.endTs === "string")
                message.endTs = parseInt(object.endTs, 10);
            else if (typeof object.endTs === "number")
                message.endTs = object.endTs;
            else if (typeof object.endTs === "object")
                message.endTs = new $util.LongBits(object.endTs.low >>> 0, object.endTs.high >>> 0).toNumber();
        if (object.name != null)
            message.name = String(object.name);
        return message;
    };

    /**
     * Creates a plain object from a SphFrameAnimationData message. Also converts values to other types if specified.
     * @function toObject
     * @memberof SphFrameAnimationData
     * @static
     * @param {SphFrameAnimationData} message SphFrameAnimationData
     * @param {$protobuf.IConversionOptions} [options] Conversion options
     * @returns {Object.<string,*>} Plain object
     */
    SphFrameAnimationData.toObject = function toObject(message, options) {
        if (!options)
            options = {};
        var object = {};
        if (options.defaults) {
            object.animationId = 0;
            object.status = 0;
            if ($util.Long) {
                var long = new $util.Long(0, 0, false);
                object.startTs = options.longs === String ? long.toString() : options.longs === Number ? long.toNumber() : long;
            } else
                object.startTs = options.longs === String ? "0" : 0;
            if ($util.Long) {
                var long = new $util.Long(0, 0, false);
                object.endTs = options.longs === String ? long.toString() : options.longs === Number ? long.toNumber() : long;
            } else
                object.endTs = options.longs === String ? "0" : 0;
            object.name = "";
        }
        if (message.animationId != null && message.hasOwnProperty("animationId"))
            object.animationId = message.animationId;
        if (message.status != null && message.hasOwnProperty("status"))
            object.status = message.status;
        if (message.startTs != null && message.hasOwnProperty("startTs"))
            if (typeof message.startTs === "number")
                object.startTs = options.longs === String ? String(message.startTs) : message.startTs;
            else
                object.startTs = options.longs === String ? $util.Long.prototype.toString.call(message.startTs) : options.longs === Number ? new $util.LongBits(message.startTs.low >>> 0, message.startTs.high >>> 0).toNumber() : message.startTs;
        if (message.endTs != null && message.hasOwnProperty("endTs"))
            if (typeof message.endTs === "number")
                object.endTs = options.longs === String ? String(message.endTs) : message.endTs;
            else
                object.endTs = options.longs === String ? $util.Long.prototype.toString.call(message.endTs) : options.longs === Number ? new $util.LongBits(message.endTs.low >>> 0, message.endTs.high >>> 0).toNumber() : message.endTs;
        if (message.name != null && message.hasOwnProperty("name"))
            object.name = message.name;
        return object;
    };

    /**
     * Converts this SphFrameAnimationData to JSON.
     * @function toJSON
     * @memberof SphFrameAnimationData
     * @instance
     * @returns {Object.<string,*>} JSON object
     */
    SphFrameAnimationData.prototype.toJSON = function toJSON() {
        return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
    };

    /**
     * Gets the default type url for SphFrameAnimationData
     * @function getTypeUrl
     * @memberof SphFrameAnimationData
     * @static
     * @param {string} [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
     * @returns {string} The default type url
     */
    SphFrameAnimationData.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
        if (typeUrlPrefix === undefined) {
            typeUrlPrefix = "type.googleapis.com";
        }
        return typeUrlPrefix + "/SphFrameAnimationData";
    };

    return SphFrameAnimationData;
})();

$root.SphFrameDynamicData = (function() {

    /**
     * Properties of a SphFrameDynamicData.
     * @exports ISphFrameDynamicData
     * @interface ISphFrameDynamicData
     * @property {number|null} [id] SphFrameDynamicData id
     * @property {string|null} [x] SphFrameDynamicData x
     * @property {string|null} [y] SphFrameDynamicData y
     * @property {string|null} [width] SphFrameDynamicData width
     * @property {string|null} [height] SphFrameDynamicData height
     * @property {string|null} [alpha] SphFrameDynamicData alpha
     * @property {number|Long|null} [ts] SphFrameDynamicData ts
     * @property {string|null} [appName] SphFrameDynamicData appName
     */

    /**
     * Constructs a new SphFrameDynamicData.
     * @exports SphFrameDynamicData
     * @classdesc Represents a SphFrameDynamicData.
     * @implements ISphFrameDynamicData
     * @constructor
     * @param {ISphFrameDynamicData=} [properties] Properties to set
     */
    function SphFrameDynamicData(properties) {
        if (properties)
            for (var keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                if (properties[keys[i]] != null)
                    this[keys[i]] = properties[keys[i]];
    }

    /**
     * SphFrameDynamicData id.
     * @member {number} id
     * @memberof SphFrameDynamicData
     * @instance
     */
    SphFrameDynamicData.prototype.id = 0;

    /**
     * SphFrameDynamicData x.
     * @member {string} x
     * @memberof SphFrameDynamicData
     * @instance
     */
    SphFrameDynamicData.prototype.x = "";

    /**
     * SphFrameDynamicData y.
     * @member {string} y
     * @memberof SphFrameDynamicData
     * @instance
     */
    SphFrameDynamicData.prototype.y = "";

    /**
     * SphFrameDynamicData width.
     * @member {string} width
     * @memberof SphFrameDynamicData
     * @instance
     */
    SphFrameDynamicData.prototype.width = "";

    /**
     * SphFrameDynamicData height.
     * @member {string} height
     * @memberof SphFrameDynamicData
     * @instance
     */
    SphFrameDynamicData.prototype.height = "";

    /**
     * SphFrameDynamicData alpha.
     * @member {string} alpha
     * @memberof SphFrameDynamicData
     * @instance
     */
    SphFrameDynamicData.prototype.alpha = "";

    /**
     * SphFrameDynamicData ts.
     * @member {number|Long} ts
     * @memberof SphFrameDynamicData
     * @instance
     */
    SphFrameDynamicData.prototype.ts = $util.Long ? $util.Long.fromBits(0,0,false) : 0;

    /**
     * SphFrameDynamicData appName.
     * @member {string} appName
     * @memberof SphFrameDynamicData
     * @instance
     */
    SphFrameDynamicData.prototype.appName = "";

    /**
     * Creates a new SphFrameDynamicData instance using the specified properties.
     * @function create
     * @memberof SphFrameDynamicData
     * @static
     * @param {ISphFrameDynamicData=} [properties] Properties to set
     * @returns {SphFrameDynamicData} SphFrameDynamicData instance
     */
    SphFrameDynamicData.create = function create(properties) {
        return new SphFrameDynamicData(properties);
    };

    /**
     * Encodes the specified SphFrameDynamicData message. Does not implicitly {@link SphFrameDynamicData.verify|verify} messages.
     * @function encode
     * @memberof SphFrameDynamicData
     * @static
     * @param {ISphFrameDynamicData} message SphFrameDynamicData message or plain object to encode
     * @param {$protobuf.Writer} [writer] Writer to encode to
     * @returns {$protobuf.Writer} Writer
     */
    SphFrameDynamicData.encode = function encode(message, writer) {
        if (!writer)
            writer = $Writer.create();
        if (message.id != null && Object.hasOwnProperty.call(message, "id"))
            writer.uint32(/* id 1, wireType 0 =*/8).int32(message.id);
        if (message.x != null && Object.hasOwnProperty.call(message, "x"))
            writer.uint32(/* id 2, wireType 2 =*/18).string(message.x);
        if (message.y != null && Object.hasOwnProperty.call(message, "y"))
            writer.uint32(/* id 3, wireType 2 =*/26).string(message.y);
        if (message.width != null && Object.hasOwnProperty.call(message, "width"))
            writer.uint32(/* id 4, wireType 2 =*/34).string(message.width);
        if (message.height != null && Object.hasOwnProperty.call(message, "height"))
            writer.uint32(/* id 5, wireType 2 =*/42).string(message.height);
        if (message.alpha != null && Object.hasOwnProperty.call(message, "alpha"))
            writer.uint32(/* id 6, wireType 2 =*/50).string(message.alpha);
        if (message.ts != null && Object.hasOwnProperty.call(message, "ts"))
            writer.uint32(/* id 7, wireType 0 =*/56).int64(message.ts);
        if (message.appName != null && Object.hasOwnProperty.call(message, "appName"))
            writer.uint32(/* id 8, wireType 2 =*/66).string(message.appName);
        return writer;
    };

    /**
     * Encodes the specified SphFrameDynamicData message, length delimited. Does not implicitly {@link SphFrameDynamicData.verify|verify} messages.
     * @function encodeDelimited
     * @memberof SphFrameDynamicData
     * @static
     * @param {ISphFrameDynamicData} message SphFrameDynamicData message or plain object to encode
     * @param {$protobuf.Writer} [writer] Writer to encode to
     * @returns {$protobuf.Writer} Writer
     */
    SphFrameDynamicData.encodeDelimited = function encodeDelimited(message, writer) {
        return this.encode(message, writer).ldelim();
    };

    /**
     * Decodes a SphFrameDynamicData message from the specified reader or buffer.
     * @function decode
     * @memberof SphFrameDynamicData
     * @static
     * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
     * @param {number} [length] Message length if known beforehand
     * @returns {SphFrameDynamicData} SphFrameDynamicData
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    SphFrameDynamicData.decode = function decode(reader, length) {
        if (!(reader instanceof $Reader))
            reader = $Reader.create(reader);
        var end = length === undefined ? reader.len : reader.pos + length, message = new $root.SphFrameDynamicData();
        while (reader.pos < end) {
            var tag = reader.uint32();
            switch (tag >>> 3) {
            case 1: {
                    message.id = reader.int32();
                    break;
                }
            case 2: {
                    message.x = reader.string();
                    break;
                }
            case 3: {
                    message.y = reader.string();
                    break;
                }
            case 4: {
                    message.width = reader.string();
                    break;
                }
            case 5: {
                    message.height = reader.string();
                    break;
                }
            case 6: {
                    message.alpha = reader.string();
                    break;
                }
            case 7: {
                    message.ts = reader.int64();
                    break;
                }
            case 8: {
                    message.appName = reader.string();
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
     * Decodes a SphFrameDynamicData message from the specified reader or buffer, length delimited.
     * @function decodeDelimited
     * @memberof SphFrameDynamicData
     * @static
     * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
     * @returns {SphFrameDynamicData} SphFrameDynamicData
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    SphFrameDynamicData.decodeDelimited = function decodeDelimited(reader) {
        if (!(reader instanceof $Reader))
            reader = new $Reader(reader);
        return this.decode(reader, reader.uint32());
    };

    /**
     * Verifies a SphFrameDynamicData message.
     * @function verify
     * @memberof SphFrameDynamicData
     * @static
     * @param {Object.<string,*>} message Plain object to verify
     * @returns {string|null} `null` if valid, otherwise the reason why it is not
     */
    SphFrameDynamicData.verify = function verify(message) {
        if (typeof message !== "object" || message === null)
            return "object expected";
        if (message.id != null && message.hasOwnProperty("id"))
            if (!$util.isInteger(message.id))
                return "id: integer expected";
        if (message.x != null && message.hasOwnProperty("x"))
            if (!$util.isString(message.x))
                return "x: string expected";
        if (message.y != null && message.hasOwnProperty("y"))
            if (!$util.isString(message.y))
                return "y: string expected";
        if (message.width != null && message.hasOwnProperty("width"))
            if (!$util.isString(message.width))
                return "width: string expected";
        if (message.height != null && message.hasOwnProperty("height"))
            if (!$util.isString(message.height))
                return "height: string expected";
        if (message.alpha != null && message.hasOwnProperty("alpha"))
            if (!$util.isString(message.alpha))
                return "alpha: string expected";
        if (message.ts != null && message.hasOwnProperty("ts"))
            if (!$util.isInteger(message.ts) && !(message.ts && $util.isInteger(message.ts.low) && $util.isInteger(message.ts.high)))
                return "ts: integer|Long expected";
        if (message.appName != null && message.hasOwnProperty("appName"))
            if (!$util.isString(message.appName))
                return "appName: string expected";
        return null;
    };

    /**
     * Creates a SphFrameDynamicData message from a plain object. Also converts values to their respective internal types.
     * @function fromObject
     * @memberof SphFrameDynamicData
     * @static
     * @param {Object.<string,*>} object Plain object
     * @returns {SphFrameDynamicData} SphFrameDynamicData
     */
    SphFrameDynamicData.fromObject = function fromObject(object) {
        if (object instanceof $root.SphFrameDynamicData)
            return object;
        var message = new $root.SphFrameDynamicData();
        if (object.id != null)
            message.id = object.id | 0;
        if (object.x != null)
            message.x = String(object.x);
        if (object.y != null)
            message.y = String(object.y);
        if (object.width != null)
            message.width = String(object.width);
        if (object.height != null)
            message.height = String(object.height);
        if (object.alpha != null)
            message.alpha = String(object.alpha);
        if (object.ts != null)
            if ($util.Long)
                (message.ts = $util.Long.fromValue(object.ts)).unsigned = false;
            else if (typeof object.ts === "string")
                message.ts = parseInt(object.ts, 10);
            else if (typeof object.ts === "number")
                message.ts = object.ts;
            else if (typeof object.ts === "object")
                message.ts = new $util.LongBits(object.ts.low >>> 0, object.ts.high >>> 0).toNumber();
        if (object.appName != null)
            message.appName = String(object.appName);
        return message;
    };

    /**
     * Creates a plain object from a SphFrameDynamicData message. Also converts values to other types if specified.
     * @function toObject
     * @memberof SphFrameDynamicData
     * @static
     * @param {SphFrameDynamicData} message SphFrameDynamicData
     * @param {$protobuf.IConversionOptions} [options] Conversion options
     * @returns {Object.<string,*>} Plain object
     */
    SphFrameDynamicData.toObject = function toObject(message, options) {
        if (!options)
            options = {};
        var object = {};
        if (options.defaults) {
            object.id = 0;
            object.x = "";
            object.y = "";
            object.width = "";
            object.height = "";
            object.alpha = "";
            if ($util.Long) {
                var long = new $util.Long(0, 0, false);
                object.ts = options.longs === String ? long.toString() : options.longs === Number ? long.toNumber() : long;
            } else
                object.ts = options.longs === String ? "0" : 0;
            object.appName = "";
        }
        if (message.id != null && message.hasOwnProperty("id"))
            object.id = message.id;
        if (message.x != null && message.hasOwnProperty("x"))
            object.x = message.x;
        if (message.y != null && message.hasOwnProperty("y"))
            object.y = message.y;
        if (message.width != null && message.hasOwnProperty("width"))
            object.width = message.width;
        if (message.height != null && message.hasOwnProperty("height"))
            object.height = message.height;
        if (message.alpha != null && message.hasOwnProperty("alpha"))
            object.alpha = message.alpha;
        if (message.ts != null && message.hasOwnProperty("ts"))
            if (typeof message.ts === "number")
                object.ts = options.longs === String ? String(message.ts) : message.ts;
            else
                object.ts = options.longs === String ? $util.Long.prototype.toString.call(message.ts) : options.longs === Number ? new $util.LongBits(message.ts.low >>> 0, message.ts.high >>> 0).toNumber() : message.ts;
        if (message.appName != null && message.hasOwnProperty("appName"))
            object.appName = message.appName;
        return object;
    };

    /**
     * Converts this SphFrameDynamicData to JSON.
     * @function toJSON
     * @memberof SphFrameDynamicData
     * @instance
     * @returns {Object.<string,*>} JSON object
     */
    SphFrameDynamicData.prototype.toJSON = function toJSON() {
        return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
    };

    /**
     * Gets the default type url for SphFrameDynamicData
     * @function getTypeUrl
     * @memberof SphFrameDynamicData
     * @static
     * @param {string} [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
     * @returns {string} The default type url
     */
    SphFrameDynamicData.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
        if (typeUrlPrefix === undefined) {
            typeUrlPrefix = "type.googleapis.com";
        }
        return typeUrlPrefix + "/SphFrameDynamicData";
    };

    return SphFrameDynamicData;
})();

$root.SphFrameSpacingData = (function() {

    /**
     * Properties of a SphFrameSpacingData.
     * @exports ISphFrameSpacingData
     * @interface ISphFrameSpacingData
     * @property {number|null} [id] SphFrameSpacingData id
     * @property {string|null} [x] SphFrameSpacingData x
     * @property {string|null} [y] SphFrameSpacingData y
     * @property {string|null} [currentFrameWidth] SphFrameSpacingData currentFrameWidth
     * @property {string|null} [currentFrameHeight] SphFrameSpacingData currentFrameHeight
     * @property {number|Long|null} [currentTs] SphFrameSpacingData currentTs
     * @property {string|null} [nameId] SphFrameSpacingData nameId
     */

    /**
     * Constructs a new SphFrameSpacingData.
     * @exports SphFrameSpacingData
     * @classdesc Represents a SphFrameSpacingData.
     * @implements ISphFrameSpacingData
     * @constructor
     * @param {ISphFrameSpacingData=} [properties] Properties to set
     */
    function SphFrameSpacingData(properties) {
        if (properties)
            for (var keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                if (properties[keys[i]] != null)
                    this[keys[i]] = properties[keys[i]];
    }

    /**
     * SphFrameSpacingData id.
     * @member {number} id
     * @memberof SphFrameSpacingData
     * @instance
     */
    SphFrameSpacingData.prototype.id = 0;

    /**
     * SphFrameSpacingData x.
     * @member {string} x
     * @memberof SphFrameSpacingData
     * @instance
     */
    SphFrameSpacingData.prototype.x = "";

    /**
     * SphFrameSpacingData y.
     * @member {string} y
     * @memberof SphFrameSpacingData
     * @instance
     */
    SphFrameSpacingData.prototype.y = "";

    /**
     * SphFrameSpacingData currentFrameWidth.
     * @member {string} currentFrameWidth
     * @memberof SphFrameSpacingData
     * @instance
     */
    SphFrameSpacingData.prototype.currentFrameWidth = "";

    /**
     * SphFrameSpacingData currentFrameHeight.
     * @member {string} currentFrameHeight
     * @memberof SphFrameSpacingData
     * @instance
     */
    SphFrameSpacingData.prototype.currentFrameHeight = "";

    /**
     * SphFrameSpacingData currentTs.
     * @member {number|Long} currentTs
     * @memberof SphFrameSpacingData
     * @instance
     */
    SphFrameSpacingData.prototype.currentTs = $util.Long ? $util.Long.fromBits(0,0,false) : 0;

    /**
     * SphFrameSpacingData nameId.
     * @member {string} nameId
     * @memberof SphFrameSpacingData
     * @instance
     */
    SphFrameSpacingData.prototype.nameId = "";

    /**
     * Creates a new SphFrameSpacingData instance using the specified properties.
     * @function create
     * @memberof SphFrameSpacingData
     * @static
     * @param {ISphFrameSpacingData=} [properties] Properties to set
     * @returns {SphFrameSpacingData} SphFrameSpacingData instance
     */
    SphFrameSpacingData.create = function create(properties) {
        return new SphFrameSpacingData(properties);
    };

    /**
     * Encodes the specified SphFrameSpacingData message. Does not implicitly {@link SphFrameSpacingData.verify|verify} messages.
     * @function encode
     * @memberof SphFrameSpacingData
     * @static
     * @param {ISphFrameSpacingData} message SphFrameSpacingData message or plain object to encode
     * @param {$protobuf.Writer} [writer] Writer to encode to
     * @returns {$protobuf.Writer} Writer
     */
    SphFrameSpacingData.encode = function encode(message, writer) {
        if (!writer)
            writer = $Writer.create();
        if (message.id != null && Object.hasOwnProperty.call(message, "id"))
            writer.uint32(/* id 1, wireType 0 =*/8).int32(message.id);
        if (message.x != null && Object.hasOwnProperty.call(message, "x"))
            writer.uint32(/* id 2, wireType 2 =*/18).string(message.x);
        if (message.y != null && Object.hasOwnProperty.call(message, "y"))
            writer.uint32(/* id 3, wireType 2 =*/26).string(message.y);
        if (message.currentFrameWidth != null && Object.hasOwnProperty.call(message, "currentFrameWidth"))
            writer.uint32(/* id 4, wireType 2 =*/34).string(message.currentFrameWidth);
        if (message.currentFrameHeight != null && Object.hasOwnProperty.call(message, "currentFrameHeight"))
            writer.uint32(/* id 5, wireType 2 =*/42).string(message.currentFrameHeight);
        if (message.currentTs != null && Object.hasOwnProperty.call(message, "currentTs"))
            writer.uint32(/* id 6, wireType 0 =*/48).int64(message.currentTs);
        if (message.nameId != null && Object.hasOwnProperty.call(message, "nameId"))
            writer.uint32(/* id 7, wireType 2 =*/58).string(message.nameId);
        return writer;
    };

    /**
     * Encodes the specified SphFrameSpacingData message, length delimited. Does not implicitly {@link SphFrameSpacingData.verify|verify} messages.
     * @function encodeDelimited
     * @memberof SphFrameSpacingData
     * @static
     * @param {ISphFrameSpacingData} message SphFrameSpacingData message or plain object to encode
     * @param {$protobuf.Writer} [writer] Writer to encode to
     * @returns {$protobuf.Writer} Writer
     */
    SphFrameSpacingData.encodeDelimited = function encodeDelimited(message, writer) {
        return this.encode(message, writer).ldelim();
    };

    /**
     * Decodes a SphFrameSpacingData message from the specified reader or buffer.
     * @function decode
     * @memberof SphFrameSpacingData
     * @static
     * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
     * @param {number} [length] Message length if known beforehand
     * @returns {SphFrameSpacingData} SphFrameSpacingData
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    SphFrameSpacingData.decode = function decode(reader, length) {
        if (!(reader instanceof $Reader))
            reader = $Reader.create(reader);
        var end = length === undefined ? reader.len : reader.pos + length, message = new $root.SphFrameSpacingData();
        while (reader.pos < end) {
            var tag = reader.uint32();
            switch (tag >>> 3) {
            case 1: {
                    message.id = reader.int32();
                    break;
                }
            case 2: {
                    message.x = reader.string();
                    break;
                }
            case 3: {
                    message.y = reader.string();
                    break;
                }
            case 4: {
                    message.currentFrameWidth = reader.string();
                    break;
                }
            case 5: {
                    message.currentFrameHeight = reader.string();
                    break;
                }
            case 6: {
                    message.currentTs = reader.int64();
                    break;
                }
            case 7: {
                    message.nameId = reader.string();
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
     * Decodes a SphFrameSpacingData message from the specified reader or buffer, length delimited.
     * @function decodeDelimited
     * @memberof SphFrameSpacingData
     * @static
     * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
     * @returns {SphFrameSpacingData} SphFrameSpacingData
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    SphFrameSpacingData.decodeDelimited = function decodeDelimited(reader) {
        if (!(reader instanceof $Reader))
            reader = new $Reader(reader);
        return this.decode(reader, reader.uint32());
    };

    /**
     * Verifies a SphFrameSpacingData message.
     * @function verify
     * @memberof SphFrameSpacingData
     * @static
     * @param {Object.<string,*>} message Plain object to verify
     * @returns {string|null} `null` if valid, otherwise the reason why it is not
     */
    SphFrameSpacingData.verify = function verify(message) {
        if (typeof message !== "object" || message === null)
            return "object expected";
        if (message.id != null && message.hasOwnProperty("id"))
            if (!$util.isInteger(message.id))
                return "id: integer expected";
        if (message.x != null && message.hasOwnProperty("x"))
            if (!$util.isString(message.x))
                return "x: string expected";
        if (message.y != null && message.hasOwnProperty("y"))
            if (!$util.isString(message.y))
                return "y: string expected";
        if (message.currentFrameWidth != null && message.hasOwnProperty("currentFrameWidth"))
            if (!$util.isString(message.currentFrameWidth))
                return "currentFrameWidth: string expected";
        if (message.currentFrameHeight != null && message.hasOwnProperty("currentFrameHeight"))
            if (!$util.isString(message.currentFrameHeight))
                return "currentFrameHeight: string expected";
        if (message.currentTs != null && message.hasOwnProperty("currentTs"))
            if (!$util.isInteger(message.currentTs) && !(message.currentTs && $util.isInteger(message.currentTs.low) && $util.isInteger(message.currentTs.high)))
                return "currentTs: integer|Long expected";
        if (message.nameId != null && message.hasOwnProperty("nameId"))
            if (!$util.isString(message.nameId))
                return "nameId: string expected";
        return null;
    };

    /**
     * Creates a SphFrameSpacingData message from a plain object. Also converts values to their respective internal types.
     * @function fromObject
     * @memberof SphFrameSpacingData
     * @static
     * @param {Object.<string,*>} object Plain object
     * @returns {SphFrameSpacingData} SphFrameSpacingData
     */
    SphFrameSpacingData.fromObject = function fromObject(object) {
        if (object instanceof $root.SphFrameSpacingData)
            return object;
        var message = new $root.SphFrameSpacingData();
        if (object.id != null)
            message.id = object.id | 0;
        if (object.x != null)
            message.x = String(object.x);
        if (object.y != null)
            message.y = String(object.y);
        if (object.currentFrameWidth != null)
            message.currentFrameWidth = String(object.currentFrameWidth);
        if (object.currentFrameHeight != null)
            message.currentFrameHeight = String(object.currentFrameHeight);
        if (object.currentTs != null)
            if ($util.Long)
                (message.currentTs = $util.Long.fromValue(object.currentTs)).unsigned = false;
            else if (typeof object.currentTs === "string")
                message.currentTs = parseInt(object.currentTs, 10);
            else if (typeof object.currentTs === "number")
                message.currentTs = object.currentTs;
            else if (typeof object.currentTs === "object")
                message.currentTs = new $util.LongBits(object.currentTs.low >>> 0, object.currentTs.high >>> 0).toNumber();
        if (object.nameId != null)
            message.nameId = String(object.nameId);
        return message;
    };

    /**
     * Creates a plain object from a SphFrameSpacingData message. Also converts values to other types if specified.
     * @function toObject
     * @memberof SphFrameSpacingData
     * @static
     * @param {SphFrameSpacingData} message SphFrameSpacingData
     * @param {$protobuf.IConversionOptions} [options] Conversion options
     * @returns {Object.<string,*>} Plain object
     */
    SphFrameSpacingData.toObject = function toObject(message, options) {
        if (!options)
            options = {};
        var object = {};
        if (options.defaults) {
            object.id = 0;
            object.x = "";
            object.y = "";
            object.currentFrameWidth = "";
            object.currentFrameHeight = "";
            if ($util.Long) {
                var long = new $util.Long(0, 0, false);
                object.currentTs = options.longs === String ? long.toString() : options.longs === Number ? long.toNumber() : long;
            } else
                object.currentTs = options.longs === String ? "0" : 0;
            object.nameId = "";
        }
        if (message.id != null && message.hasOwnProperty("id"))
            object.id = message.id;
        if (message.x != null && message.hasOwnProperty("x"))
            object.x = message.x;
        if (message.y != null && message.hasOwnProperty("y"))
            object.y = message.y;
        if (message.currentFrameWidth != null && message.hasOwnProperty("currentFrameWidth"))
            object.currentFrameWidth = message.currentFrameWidth;
        if (message.currentFrameHeight != null && message.hasOwnProperty("currentFrameHeight"))
            object.currentFrameHeight = message.currentFrameHeight;
        if (message.currentTs != null && message.hasOwnProperty("currentTs"))
            if (typeof message.currentTs === "number")
                object.currentTs = options.longs === String ? String(message.currentTs) : message.currentTs;
            else
                object.currentTs = options.longs === String ? $util.Long.prototype.toString.call(message.currentTs) : options.longs === Number ? new $util.LongBits(message.currentTs.low >>> 0, message.currentTs.high >>> 0).toNumber() : message.currentTs;
        if (message.nameId != null && message.hasOwnProperty("nameId"))
            object.nameId = message.nameId;
        return object;
    };

    /**
     * Converts this SphFrameSpacingData to JSON.
     * @function toJSON
     * @memberof SphFrameSpacingData
     * @instance
     * @returns {Object.<string,*>} JSON object
     */
    SphFrameSpacingData.prototype.toJSON = function toJSON() {
        return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
    };

    /**
     * Gets the default type url for SphFrameSpacingData
     * @function getTypeUrl
     * @memberof SphFrameSpacingData
     * @static
     * @param {string} [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
     * @returns {string} The default type url
     */
    SphFrameSpacingData.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
        if (typeUrlPrefix === undefined) {
            typeUrlPrefix = "type.googleapis.com";
        }
        return typeUrlPrefix + "/SphFrameSpacingData";
    };

    return SphFrameSpacingData;
})();

$root.SphEbpfData = (function() {

    /**
     * Properties of a SphEbpfData.
     * @exports ISphEbpfData
     * @interface ISphEbpfData
     * @property {number|Long|null} [startNs] SphEbpfData startNs
     * @property {number|Long|null} [endNs] SphEbpfData endNs
     * @property {number|Long|null} [dur] SphEbpfData dur
     * @property {number|Long|null} [size] SphEbpfData size
     */

    /**
     * Constructs a new SphEbpfData.
     * @exports SphEbpfData
     * @classdesc Represents a SphEbpfData.
     * @implements ISphEbpfData
     * @constructor
     * @param {ISphEbpfData=} [properties] Properties to set
     */
    function SphEbpfData(properties) {
        if (properties)
            for (var keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                if (properties[keys[i]] != null)
                    this[keys[i]] = properties[keys[i]];
    }

    /**
     * SphEbpfData startNs.
     * @member {number|Long} startNs
     * @memberof SphEbpfData
     * @instance
     */
    SphEbpfData.prototype.startNs = $util.Long ? $util.Long.fromBits(0,0,false) : 0;

    /**
     * SphEbpfData endNs.
     * @member {number|Long} endNs
     * @memberof SphEbpfData
     * @instance
     */
    SphEbpfData.prototype.endNs = $util.Long ? $util.Long.fromBits(0,0,false) : 0;

    /**
     * SphEbpfData dur.
     * @member {number|Long} dur
     * @memberof SphEbpfData
     * @instance
     */
    SphEbpfData.prototype.dur = $util.Long ? $util.Long.fromBits(0,0,false) : 0;

    /**
     * SphEbpfData size.
     * @member {number|Long} size
     * @memberof SphEbpfData
     * @instance
     */
    SphEbpfData.prototype.size = $util.Long ? $util.Long.fromBits(0,0,false) : 0;

    /**
     * Creates a new SphEbpfData instance using the specified properties.
     * @function create
     * @memberof SphEbpfData
     * @static
     * @param {ISphEbpfData=} [properties] Properties to set
     * @returns {SphEbpfData} SphEbpfData instance
     */
    SphEbpfData.create = function create(properties) {
        return new SphEbpfData(properties);
    };

    /**
     * Encodes the specified SphEbpfData message. Does not implicitly {@link SphEbpfData.verify|verify} messages.
     * @function encode
     * @memberof SphEbpfData
     * @static
     * @param {ISphEbpfData} message SphEbpfData message or plain object to encode
     * @param {$protobuf.Writer} [writer] Writer to encode to
     * @returns {$protobuf.Writer} Writer
     */
    SphEbpfData.encode = function encode(message, writer) {
        if (!writer)
            writer = $Writer.create();
        if (message.startNs != null && Object.hasOwnProperty.call(message, "startNs"))
            writer.uint32(/* id 1, wireType 0 =*/8).int64(message.startNs);
        if (message.endNs != null && Object.hasOwnProperty.call(message, "endNs"))
            writer.uint32(/* id 2, wireType 0 =*/16).int64(message.endNs);
        if (message.dur != null && Object.hasOwnProperty.call(message, "dur"))
            writer.uint32(/* id 3, wireType 0 =*/24).int64(message.dur);
        if (message.size != null && Object.hasOwnProperty.call(message, "size"))
            writer.uint32(/* id 4, wireType 0 =*/32).int64(message.size);
        return writer;
    };

    /**
     * Encodes the specified SphEbpfData message, length delimited. Does not implicitly {@link SphEbpfData.verify|verify} messages.
     * @function encodeDelimited
     * @memberof SphEbpfData
     * @static
     * @param {ISphEbpfData} message SphEbpfData message or plain object to encode
     * @param {$protobuf.Writer} [writer] Writer to encode to
     * @returns {$protobuf.Writer} Writer
     */
    SphEbpfData.encodeDelimited = function encodeDelimited(message, writer) {
        return this.encode(message, writer).ldelim();
    };

    /**
     * Decodes a SphEbpfData message from the specified reader or buffer.
     * @function decode
     * @memberof SphEbpfData
     * @static
     * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
     * @param {number} [length] Message length if known beforehand
     * @returns {SphEbpfData} SphEbpfData
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    SphEbpfData.decode = function decode(reader, length) {
        if (!(reader instanceof $Reader))
            reader = $Reader.create(reader);
        var end = length === undefined ? reader.len : reader.pos + length, message = new $root.SphEbpfData();
        while (reader.pos < end) {
            var tag = reader.uint32();
            switch (tag >>> 3) {
            case 1: {
                    message.startNs = reader.int64();
                    break;
                }
            case 2: {
                    message.endNs = reader.int64();
                    break;
                }
            case 3: {
                    message.dur = reader.int64();
                    break;
                }
            case 4: {
                    message.size = reader.int64();
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
     * Decodes a SphEbpfData message from the specified reader or buffer, length delimited.
     * @function decodeDelimited
     * @memberof SphEbpfData
     * @static
     * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
     * @returns {SphEbpfData} SphEbpfData
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    SphEbpfData.decodeDelimited = function decodeDelimited(reader) {
        if (!(reader instanceof $Reader))
            reader = new $Reader(reader);
        return this.decode(reader, reader.uint32());
    };

    /**
     * Verifies a SphEbpfData message.
     * @function verify
     * @memberof SphEbpfData
     * @static
     * @param {Object.<string,*>} message Plain object to verify
     * @returns {string|null} `null` if valid, otherwise the reason why it is not
     */
    SphEbpfData.verify = function verify(message) {
        if (typeof message !== "object" || message === null)
            return "object expected";
        if (message.startNs != null && message.hasOwnProperty("startNs"))
            if (!$util.isInteger(message.startNs) && !(message.startNs && $util.isInteger(message.startNs.low) && $util.isInteger(message.startNs.high)))
                return "startNs: integer|Long expected";
        if (message.endNs != null && message.hasOwnProperty("endNs"))
            if (!$util.isInteger(message.endNs) && !(message.endNs && $util.isInteger(message.endNs.low) && $util.isInteger(message.endNs.high)))
                return "endNs: integer|Long expected";
        if (message.dur != null && message.hasOwnProperty("dur"))
            if (!$util.isInteger(message.dur) && !(message.dur && $util.isInteger(message.dur.low) && $util.isInteger(message.dur.high)))
                return "dur: integer|Long expected";
        if (message.size != null && message.hasOwnProperty("size"))
            if (!$util.isInteger(message.size) && !(message.size && $util.isInteger(message.size.low) && $util.isInteger(message.size.high)))
                return "size: integer|Long expected";
        return null;
    };

    /**
     * Creates a SphEbpfData message from a plain object. Also converts values to their respective internal types.
     * @function fromObject
     * @memberof SphEbpfData
     * @static
     * @param {Object.<string,*>} object Plain object
     * @returns {SphEbpfData} SphEbpfData
     */
    SphEbpfData.fromObject = function fromObject(object) {
        if (object instanceof $root.SphEbpfData)
            return object;
        var message = new $root.SphEbpfData();
        if (object.startNs != null)
            if ($util.Long)
                (message.startNs = $util.Long.fromValue(object.startNs)).unsigned = false;
            else if (typeof object.startNs === "string")
                message.startNs = parseInt(object.startNs, 10);
            else if (typeof object.startNs === "number")
                message.startNs = object.startNs;
            else if (typeof object.startNs === "object")
                message.startNs = new $util.LongBits(object.startNs.low >>> 0, object.startNs.high >>> 0).toNumber();
        if (object.endNs != null)
            if ($util.Long)
                (message.endNs = $util.Long.fromValue(object.endNs)).unsigned = false;
            else if (typeof object.endNs === "string")
                message.endNs = parseInt(object.endNs, 10);
            else if (typeof object.endNs === "number")
                message.endNs = object.endNs;
            else if (typeof object.endNs === "object")
                message.endNs = new $util.LongBits(object.endNs.low >>> 0, object.endNs.high >>> 0).toNumber();
        if (object.dur != null)
            if ($util.Long)
                (message.dur = $util.Long.fromValue(object.dur)).unsigned = false;
            else if (typeof object.dur === "string")
                message.dur = parseInt(object.dur, 10);
            else if (typeof object.dur === "number")
                message.dur = object.dur;
            else if (typeof object.dur === "object")
                message.dur = new $util.LongBits(object.dur.low >>> 0, object.dur.high >>> 0).toNumber();
        if (object.size != null)
            if ($util.Long)
                (message.size = $util.Long.fromValue(object.size)).unsigned = false;
            else if (typeof object.size === "string")
                message.size = parseInt(object.size, 10);
            else if (typeof object.size === "number")
                message.size = object.size;
            else if (typeof object.size === "object")
                message.size = new $util.LongBits(object.size.low >>> 0, object.size.high >>> 0).toNumber();
        return message;
    };

    /**
     * Creates a plain object from a SphEbpfData message. Also converts values to other types if specified.
     * @function toObject
     * @memberof SphEbpfData
     * @static
     * @param {SphEbpfData} message SphEbpfData
     * @param {$protobuf.IConversionOptions} [options] Conversion options
     * @returns {Object.<string,*>} Plain object
     */
    SphEbpfData.toObject = function toObject(message, options) {
        if (!options)
            options = {};
        var object = {};
        if (options.defaults) {
            if ($util.Long) {
                var long = new $util.Long(0, 0, false);
                object.startNs = options.longs === String ? long.toString() : options.longs === Number ? long.toNumber() : long;
            } else
                object.startNs = options.longs === String ? "0" : 0;
            if ($util.Long) {
                var long = new $util.Long(0, 0, false);
                object.endNs = options.longs === String ? long.toString() : options.longs === Number ? long.toNumber() : long;
            } else
                object.endNs = options.longs === String ? "0" : 0;
            if ($util.Long) {
                var long = new $util.Long(0, 0, false);
                object.dur = options.longs === String ? long.toString() : options.longs === Number ? long.toNumber() : long;
            } else
                object.dur = options.longs === String ? "0" : 0;
            if ($util.Long) {
                var long = new $util.Long(0, 0, false);
                object.size = options.longs === String ? long.toString() : options.longs === Number ? long.toNumber() : long;
            } else
                object.size = options.longs === String ? "0" : 0;
        }
        if (message.startNs != null && message.hasOwnProperty("startNs"))
            if (typeof message.startNs === "number")
                object.startNs = options.longs === String ? String(message.startNs) : message.startNs;
            else
                object.startNs = options.longs === String ? $util.Long.prototype.toString.call(message.startNs) : options.longs === Number ? new $util.LongBits(message.startNs.low >>> 0, message.startNs.high >>> 0).toNumber() : message.startNs;
        if (message.endNs != null && message.hasOwnProperty("endNs"))
            if (typeof message.endNs === "number")
                object.endNs = options.longs === String ? String(message.endNs) : message.endNs;
            else
                object.endNs = options.longs === String ? $util.Long.prototype.toString.call(message.endNs) : options.longs === Number ? new $util.LongBits(message.endNs.low >>> 0, message.endNs.high >>> 0).toNumber() : message.endNs;
        if (message.dur != null && message.hasOwnProperty("dur"))
            if (typeof message.dur === "number")
                object.dur = options.longs === String ? String(message.dur) : message.dur;
            else
                object.dur = options.longs === String ? $util.Long.prototype.toString.call(message.dur) : options.longs === Number ? new $util.LongBits(message.dur.low >>> 0, message.dur.high >>> 0).toNumber() : message.dur;
        if (message.size != null && message.hasOwnProperty("size"))
            if (typeof message.size === "number")
                object.size = options.longs === String ? String(message.size) : message.size;
            else
                object.size = options.longs === String ? $util.Long.prototype.toString.call(message.size) : options.longs === Number ? new $util.LongBits(message.size.low >>> 0, message.size.high >>> 0).toNumber() : message.size;
        return object;
    };

    /**
     * Converts this SphEbpfData to JSON.
     * @function toJSON
     * @memberof SphEbpfData
     * @instance
     * @returns {Object.<string,*>} JSON object
     */
    SphEbpfData.prototype.toJSON = function toJSON() {
        return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
    };

    /**
     * Gets the default type url for SphEbpfData
     * @function getTypeUrl
     * @memberof SphEbpfData
     * @static
     * @param {string} [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
     * @returns {string} The default type url
     */
    SphEbpfData.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
        if (typeUrlPrefix === undefined) {
            typeUrlPrefix = "type.googleapis.com";
        }
        return typeUrlPrefix + "/SphEbpfData";
    };

    return SphEbpfData;
})();

$root.SphTrackerData = (function() {

    /**
     * Properties of a SphTrackerData.
     * @exports ISphTrackerData
     * @interface ISphTrackerData
     * @property {number|Long|null} [startNs] SphTrackerData startNs
     * @property {number|Long|null} [value] SphTrackerData value
     */

    /**
     * Constructs a new SphTrackerData.
     * @exports SphTrackerData
     * @classdesc Represents a SphTrackerData.
     * @implements ISphTrackerData
     * @constructor
     * @param {ISphTrackerData=} [properties] Properties to set
     */
    function SphTrackerData(properties) {
        if (properties)
            for (var keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                if (properties[keys[i]] != null)
                    this[keys[i]] = properties[keys[i]];
    }

    /**
     * SphTrackerData startNs.
     * @member {number|Long} startNs
     * @memberof SphTrackerData
     * @instance
     */
    SphTrackerData.prototype.startNs = $util.Long ? $util.Long.fromBits(0,0,false) : 0;

    /**
     * SphTrackerData value.
     * @member {number|Long} value
     * @memberof SphTrackerData
     * @instance
     */
    SphTrackerData.prototype.value = $util.Long ? $util.Long.fromBits(0,0,false) : 0;

    /**
     * Creates a new SphTrackerData instance using the specified properties.
     * @function create
     * @memberof SphTrackerData
     * @static
     * @param {ISphTrackerData=} [properties] Properties to set
     * @returns {SphTrackerData} SphTrackerData instance
     */
    SphTrackerData.create = function create(properties) {
        return new SphTrackerData(properties);
    };

    /**
     * Encodes the specified SphTrackerData message. Does not implicitly {@link SphTrackerData.verify|verify} messages.
     * @function encode
     * @memberof SphTrackerData
     * @static
     * @param {ISphTrackerData} message SphTrackerData message or plain object to encode
     * @param {$protobuf.Writer} [writer] Writer to encode to
     * @returns {$protobuf.Writer} Writer
     */
    SphTrackerData.encode = function encode(message, writer) {
        if (!writer)
            writer = $Writer.create();
        if (message.startNs != null && Object.hasOwnProperty.call(message, "startNs"))
            writer.uint32(/* id 1, wireType 0 =*/8).int64(message.startNs);
        if (message.value != null && Object.hasOwnProperty.call(message, "value"))
            writer.uint32(/* id 2, wireType 0 =*/16).int64(message.value);
        return writer;
    };

    /**
     * Encodes the specified SphTrackerData message, length delimited. Does not implicitly {@link SphTrackerData.verify|verify} messages.
     * @function encodeDelimited
     * @memberof SphTrackerData
     * @static
     * @param {ISphTrackerData} message SphTrackerData message or plain object to encode
     * @param {$protobuf.Writer} [writer] Writer to encode to
     * @returns {$protobuf.Writer} Writer
     */
    SphTrackerData.encodeDelimited = function encodeDelimited(message, writer) {
        return this.encode(message, writer).ldelim();
    };

    /**
     * Decodes a SphTrackerData message from the specified reader or buffer.
     * @function decode
     * @memberof SphTrackerData
     * @static
     * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
     * @param {number} [length] Message length if known beforehand
     * @returns {SphTrackerData} SphTrackerData
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    SphTrackerData.decode = function decode(reader, length) {
        if (!(reader instanceof $Reader))
            reader = $Reader.create(reader);
        var end = length === undefined ? reader.len : reader.pos + length, message = new $root.SphTrackerData();
        while (reader.pos < end) {
            var tag = reader.uint32();
            switch (tag >>> 3) {
            case 1: {
                    message.startNs = reader.int64();
                    break;
                }
            case 2: {
                    message.value = reader.int64();
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
     * Decodes a SphTrackerData message from the specified reader or buffer, length delimited.
     * @function decodeDelimited
     * @memberof SphTrackerData
     * @static
     * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
     * @returns {SphTrackerData} SphTrackerData
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    SphTrackerData.decodeDelimited = function decodeDelimited(reader) {
        if (!(reader instanceof $Reader))
            reader = new $Reader(reader);
        return this.decode(reader, reader.uint32());
    };

    /**
     * Verifies a SphTrackerData message.
     * @function verify
     * @memberof SphTrackerData
     * @static
     * @param {Object.<string,*>} message Plain object to verify
     * @returns {string|null} `null` if valid, otherwise the reason why it is not
     */
    SphTrackerData.verify = function verify(message) {
        if (typeof message !== "object" || message === null)
            return "object expected";
        if (message.startNs != null && message.hasOwnProperty("startNs"))
            if (!$util.isInteger(message.startNs) && !(message.startNs && $util.isInteger(message.startNs.low) && $util.isInteger(message.startNs.high)))
                return "startNs: integer|Long expected";
        if (message.value != null && message.hasOwnProperty("value"))
            if (!$util.isInteger(message.value) && !(message.value && $util.isInteger(message.value.low) && $util.isInteger(message.value.high)))
                return "value: integer|Long expected";
        return null;
    };

    /**
     * Creates a SphTrackerData message from a plain object. Also converts values to their respective internal types.
     * @function fromObject
     * @memberof SphTrackerData
     * @static
     * @param {Object.<string,*>} object Plain object
     * @returns {SphTrackerData} SphTrackerData
     */
    SphTrackerData.fromObject = function fromObject(object) {
        if (object instanceof $root.SphTrackerData)
            return object;
        var message = new $root.SphTrackerData();
        if (object.startNs != null)
            if ($util.Long)
                (message.startNs = $util.Long.fromValue(object.startNs)).unsigned = false;
            else if (typeof object.startNs === "string")
                message.startNs = parseInt(object.startNs, 10);
            else if (typeof object.startNs === "number")
                message.startNs = object.startNs;
            else if (typeof object.startNs === "object")
                message.startNs = new $util.LongBits(object.startNs.low >>> 0, object.startNs.high >>> 0).toNumber();
        if (object.value != null)
            if ($util.Long)
                (message.value = $util.Long.fromValue(object.value)).unsigned = false;
            else if (typeof object.value === "string")
                message.value = parseInt(object.value, 10);
            else if (typeof object.value === "number")
                message.value = object.value;
            else if (typeof object.value === "object")
                message.value = new $util.LongBits(object.value.low >>> 0, object.value.high >>> 0).toNumber();
        return message;
    };

    /**
     * Creates a plain object from a SphTrackerData message. Also converts values to other types if specified.
     * @function toObject
     * @memberof SphTrackerData
     * @static
     * @param {SphTrackerData} message SphTrackerData
     * @param {$protobuf.IConversionOptions} [options] Conversion options
     * @returns {Object.<string,*>} Plain object
     */
    SphTrackerData.toObject = function toObject(message, options) {
        if (!options)
            options = {};
        var object = {};
        if (options.defaults) {
            if ($util.Long) {
                var long = new $util.Long(0, 0, false);
                object.startNs = options.longs === String ? long.toString() : options.longs === Number ? long.toNumber() : long;
            } else
                object.startNs = options.longs === String ? "0" : 0;
            if ($util.Long) {
                var long = new $util.Long(0, 0, false);
                object.value = options.longs === String ? long.toString() : options.longs === Number ? long.toNumber() : long;
            } else
                object.value = options.longs === String ? "0" : 0;
        }
        if (message.startNs != null && message.hasOwnProperty("startNs"))
            if (typeof message.startNs === "number")
                object.startNs = options.longs === String ? String(message.startNs) : message.startNs;
            else
                object.startNs = options.longs === String ? $util.Long.prototype.toString.call(message.startNs) : options.longs === Number ? new $util.LongBits(message.startNs.low >>> 0, message.startNs.high >>> 0).toNumber() : message.startNs;
        if (message.value != null && message.hasOwnProperty("value"))
            if (typeof message.value === "number")
                object.value = options.longs === String ? String(message.value) : message.value;
            else
                object.value = options.longs === String ? $util.Long.prototype.toString.call(message.value) : options.longs === Number ? new $util.LongBits(message.value.low >>> 0, message.value.high >>> 0).toNumber() : message.value;
        return object;
    };

    /**
     * Converts this SphTrackerData to JSON.
     * @function toJSON
     * @memberof SphTrackerData
     * @instance
     * @returns {Object.<string,*>} JSON object
     */
    SphTrackerData.prototype.toJSON = function toJSON() {
        return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
    };

    /**
     * Gets the default type url for SphTrackerData
     * @function getTypeUrl
     * @memberof SphTrackerData
     * @static
     * @param {string} [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
     * @returns {string} The default type url
     */
    SphTrackerData.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
        if (typeUrlPrefix === undefined) {
            typeUrlPrefix = "type.googleapis.com";
        }
        return typeUrlPrefix + "/SphTrackerData";
    };

    return SphTrackerData;
})();

$root.SphAbilityData = (function() {

    /**
     * Properties of a SphAbilityData.
     * @exports ISphAbilityData
     * @interface ISphAbilityData
     * @property {number|Long|null} [value] SphAbilityData value
     * @property {number|Long|null} [startNs] SphAbilityData startNs
     * @property {number|null} [dur] SphAbilityData dur
     */

    /**
     * Constructs a new SphAbilityData.
     * @exports SphAbilityData
     * @classdesc Represents a SphAbilityData.
     * @implements ISphAbilityData
     * @constructor
     * @param {ISphAbilityData=} [properties] Properties to set
     */
    function SphAbilityData(properties) {
        if (properties)
            for (var keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                if (properties[keys[i]] != null)
                    this[keys[i]] = properties[keys[i]];
    }

    /**
     * SphAbilityData value.
     * @member {number|Long} value
     * @memberof SphAbilityData
     * @instance
     */
    SphAbilityData.prototype.value = $util.Long ? $util.Long.fromBits(0,0,false) : 0;

    /**
     * SphAbilityData startNs.
     * @member {number|Long} startNs
     * @memberof SphAbilityData
     * @instance
     */
    SphAbilityData.prototype.startNs = $util.Long ? $util.Long.fromBits(0,0,false) : 0;

    /**
     * SphAbilityData dur.
     * @member {number} dur
     * @memberof SphAbilityData
     * @instance
     */
    SphAbilityData.prototype.dur = 0;

    /**
     * Creates a new SphAbilityData instance using the specified properties.
     * @function create
     * @memberof SphAbilityData
     * @static
     * @param {ISphAbilityData=} [properties] Properties to set
     * @returns {SphAbilityData} SphAbilityData instance
     */
    SphAbilityData.create = function create(properties) {
        return new SphAbilityData(properties);
    };

    /**
     * Encodes the specified SphAbilityData message. Does not implicitly {@link SphAbilityData.verify|verify} messages.
     * @function encode
     * @memberof SphAbilityData
     * @static
     * @param {ISphAbilityData} message SphAbilityData message or plain object to encode
     * @param {$protobuf.Writer} [writer] Writer to encode to
     * @returns {$protobuf.Writer} Writer
     */
    SphAbilityData.encode = function encode(message, writer) {
        if (!writer)
            writer = $Writer.create();
        if (message.value != null && Object.hasOwnProperty.call(message, "value"))
            writer.uint32(/* id 1, wireType 0 =*/8).int64(message.value);
        if (message.startNs != null && Object.hasOwnProperty.call(message, "startNs"))
            writer.uint32(/* id 2, wireType 0 =*/16).int64(message.startNs);
        if (message.dur != null && Object.hasOwnProperty.call(message, "dur"))
            writer.uint32(/* id 3, wireType 0 =*/24).int32(message.dur);
        return writer;
    };

    /**
     * Encodes the specified SphAbilityData message, length delimited. Does not implicitly {@link SphAbilityData.verify|verify} messages.
     * @function encodeDelimited
     * @memberof SphAbilityData
     * @static
     * @param {ISphAbilityData} message SphAbilityData message or plain object to encode
     * @param {$protobuf.Writer} [writer] Writer to encode to
     * @returns {$protobuf.Writer} Writer
     */
    SphAbilityData.encodeDelimited = function encodeDelimited(message, writer) {
        return this.encode(message, writer).ldelim();
    };

    /**
     * Decodes a SphAbilityData message from the specified reader or buffer.
     * @function decode
     * @memberof SphAbilityData
     * @static
     * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
     * @param {number} [length] Message length if known beforehand
     * @returns {SphAbilityData} SphAbilityData
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    SphAbilityData.decode = function decode(reader, length) {
        if (!(reader instanceof $Reader))
            reader = $Reader.create(reader);
        var end = length === undefined ? reader.len : reader.pos + length, message = new $root.SphAbilityData();
        while (reader.pos < end) {
            var tag = reader.uint32();
            switch (tag >>> 3) {
            case 1: {
                    message.value = reader.int64();
                    break;
                }
            case 2: {
                    message.startNs = reader.int64();
                    break;
                }
            case 3: {
                    message.dur = reader.int32();
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
     * Decodes a SphAbilityData message from the specified reader or buffer, length delimited.
     * @function decodeDelimited
     * @memberof SphAbilityData
     * @static
     * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
     * @returns {SphAbilityData} SphAbilityData
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    SphAbilityData.decodeDelimited = function decodeDelimited(reader) {
        if (!(reader instanceof $Reader))
            reader = new $Reader(reader);
        return this.decode(reader, reader.uint32());
    };

    /**
     * Verifies a SphAbilityData message.
     * @function verify
     * @memberof SphAbilityData
     * @static
     * @param {Object.<string,*>} message Plain object to verify
     * @returns {string|null} `null` if valid, otherwise the reason why it is not
     */
    SphAbilityData.verify = function verify(message) {
        if (typeof message !== "object" || message === null)
            return "object expected";
        if (message.value != null && message.hasOwnProperty("value"))
            if (!$util.isInteger(message.value) && !(message.value && $util.isInteger(message.value.low) && $util.isInteger(message.value.high)))
                return "value: integer|Long expected";
        if (message.startNs != null && message.hasOwnProperty("startNs"))
            if (!$util.isInteger(message.startNs) && !(message.startNs && $util.isInteger(message.startNs.low) && $util.isInteger(message.startNs.high)))
                return "startNs: integer|Long expected";
        if (message.dur != null && message.hasOwnProperty("dur"))
            if (!$util.isInteger(message.dur))
                return "dur: integer expected";
        return null;
    };

    /**
     * Creates a SphAbilityData message from a plain object. Also converts values to their respective internal types.
     * @function fromObject
     * @memberof SphAbilityData
     * @static
     * @param {Object.<string,*>} object Plain object
     * @returns {SphAbilityData} SphAbilityData
     */
    SphAbilityData.fromObject = function fromObject(object) {
        if (object instanceof $root.SphAbilityData)
            return object;
        var message = new $root.SphAbilityData();
        if (object.value != null)
            if ($util.Long)
                (message.value = $util.Long.fromValue(object.value)).unsigned = false;
            else if (typeof object.value === "string")
                message.value = parseInt(object.value, 10);
            else if (typeof object.value === "number")
                message.value = object.value;
            else if (typeof object.value === "object")
                message.value = new $util.LongBits(object.value.low >>> 0, object.value.high >>> 0).toNumber();
        if (object.startNs != null)
            if ($util.Long)
                (message.startNs = $util.Long.fromValue(object.startNs)).unsigned = false;
            else if (typeof object.startNs === "string")
                message.startNs = parseInt(object.startNs, 10);
            else if (typeof object.startNs === "number")
                message.startNs = object.startNs;
            else if (typeof object.startNs === "object")
                message.startNs = new $util.LongBits(object.startNs.low >>> 0, object.startNs.high >>> 0).toNumber();
        if (object.dur != null)
            message.dur = object.dur | 0;
        return message;
    };

    /**
     * Creates a plain object from a SphAbilityData message. Also converts values to other types if specified.
     * @function toObject
     * @memberof SphAbilityData
     * @static
     * @param {SphAbilityData} message SphAbilityData
     * @param {$protobuf.IConversionOptions} [options] Conversion options
     * @returns {Object.<string,*>} Plain object
     */
    SphAbilityData.toObject = function toObject(message, options) {
        if (!options)
            options = {};
        var object = {};
        if (options.defaults) {
            if ($util.Long) {
                var long = new $util.Long(0, 0, false);
                object.value = options.longs === String ? long.toString() : options.longs === Number ? long.toNumber() : long;
            } else
                object.value = options.longs === String ? "0" : 0;
            if ($util.Long) {
                var long = new $util.Long(0, 0, false);
                object.startNs = options.longs === String ? long.toString() : options.longs === Number ? long.toNumber() : long;
            } else
                object.startNs = options.longs === String ? "0" : 0;
            object.dur = 0;
        }
        if (message.value != null && message.hasOwnProperty("value"))
            if (typeof message.value === "number")
                object.value = options.longs === String ? String(message.value) : message.value;
            else
                object.value = options.longs === String ? $util.Long.prototype.toString.call(message.value) : options.longs === Number ? new $util.LongBits(message.value.low >>> 0, message.value.high >>> 0).toNumber() : message.value;
        if (message.startNs != null && message.hasOwnProperty("startNs"))
            if (typeof message.startNs === "number")
                object.startNs = options.longs === String ? String(message.startNs) : message.startNs;
            else
                object.startNs = options.longs === String ? $util.Long.prototype.toString.call(message.startNs) : options.longs === Number ? new $util.LongBits(message.startNs.low >>> 0, message.startNs.high >>> 0).toNumber() : message.startNs;
        if (message.dur != null && message.hasOwnProperty("dur"))
            object.dur = message.dur;
        return object;
    };

    /**
     * Converts this SphAbilityData to JSON.
     * @function toJSON
     * @memberof SphAbilityData
     * @instance
     * @returns {Object.<string,*>} JSON object
     */
    SphAbilityData.prototype.toJSON = function toJSON() {
        return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
    };

    /**
     * Gets the default type url for SphAbilityData
     * @function getTypeUrl
     * @memberof SphAbilityData
     * @static
     * @param {string} [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
     * @returns {string} The default type url
     */
    SphAbilityData.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
        if (typeUrlPrefix === undefined) {
            typeUrlPrefix = "type.googleapis.com";
        }
        return typeUrlPrefix + "/SphAbilityData";
    };

    return SphAbilityData;
})();

$root.SphHiperfData = (function() {

    /**
     * Properties of a SphHiperfData.
     * @exports ISphHiperfData
     * @interface ISphHiperfData
     * @property {number|Long|null} [startNs] SphHiperfData startNs
     * @property {number|Long|null} [eventCount] SphHiperfData eventCount
     * @property {number|Long|null} [sampleCount] SphHiperfData sampleCount
     * @property {number|Long|null} [eventTypeId] SphHiperfData eventTypeId
     * @property {number|Long|null} [callchainId] SphHiperfData callchainId
     */

    /**
     * Constructs a new SphHiperfData.
     * @exports SphHiperfData
     * @classdesc Represents a SphHiperfData.
     * @implements ISphHiperfData
     * @constructor
     * @param {ISphHiperfData=} [properties] Properties to set
     */
    function SphHiperfData(properties) {
        if (properties)
            for (var keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                if (properties[keys[i]] != null)
                    this[keys[i]] = properties[keys[i]];
    }

    /**
     * SphHiperfData startNs.
     * @member {number|Long} startNs
     * @memberof SphHiperfData
     * @instance
     */
    SphHiperfData.prototype.startNs = $util.Long ? $util.Long.fromBits(0,0,false) : 0;

    /**
     * SphHiperfData eventCount.
     * @member {number|Long} eventCount
     * @memberof SphHiperfData
     * @instance
     */
    SphHiperfData.prototype.eventCount = $util.Long ? $util.Long.fromBits(0,0,false) : 0;

    /**
     * SphHiperfData sampleCount.
     * @member {number|Long} sampleCount
     * @memberof SphHiperfData
     * @instance
     */
    SphHiperfData.prototype.sampleCount = $util.Long ? $util.Long.fromBits(0,0,false) : 0;

    /**
     * SphHiperfData eventTypeId.
     * @member {number|Long} eventTypeId
     * @memberof SphHiperfData
     * @instance
     */
    SphHiperfData.prototype.eventTypeId = $util.Long ? $util.Long.fromBits(0,0,false) : 0;

    /**
     * SphHiperfData callchainId.
     * @member {number|Long} callchainId
     * @memberof SphHiperfData
     * @instance
     */
    SphHiperfData.prototype.callchainId = $util.Long ? $util.Long.fromBits(0,0,false) : 0;

    /**
     * Creates a new SphHiperfData instance using the specified properties.
     * @function create
     * @memberof SphHiperfData
     * @static
     * @param {ISphHiperfData=} [properties] Properties to set
     * @returns {SphHiperfData} SphHiperfData instance
     */
    SphHiperfData.create = function create(properties) {
        return new SphHiperfData(properties);
    };

    /**
     * Encodes the specified SphHiperfData message. Does not implicitly {@link SphHiperfData.verify|verify} messages.
     * @function encode
     * @memberof SphHiperfData
     * @static
     * @param {ISphHiperfData} message SphHiperfData message or plain object to encode
     * @param {$protobuf.Writer} [writer] Writer to encode to
     * @returns {$protobuf.Writer} Writer
     */
    SphHiperfData.encode = function encode(message, writer) {
        if (!writer)
            writer = $Writer.create();
        if (message.startNs != null && Object.hasOwnProperty.call(message, "startNs"))
            writer.uint32(/* id 1, wireType 0 =*/8).int64(message.startNs);
        if (message.eventCount != null && Object.hasOwnProperty.call(message, "eventCount"))
            writer.uint32(/* id 2, wireType 0 =*/16).int64(message.eventCount);
        if (message.sampleCount != null && Object.hasOwnProperty.call(message, "sampleCount"))
            writer.uint32(/* id 3, wireType 0 =*/24).int64(message.sampleCount);
        if (message.eventTypeId != null && Object.hasOwnProperty.call(message, "eventTypeId"))
            writer.uint32(/* id 4, wireType 0 =*/32).int64(message.eventTypeId);
        if (message.callchainId != null && Object.hasOwnProperty.call(message, "callchainId"))
            writer.uint32(/* id 5, wireType 0 =*/40).int64(message.callchainId);
        return writer;
    };

    /**
     * Encodes the specified SphHiperfData message, length delimited. Does not implicitly {@link SphHiperfData.verify|verify} messages.
     * @function encodeDelimited
     * @memberof SphHiperfData
     * @static
     * @param {ISphHiperfData} message SphHiperfData message or plain object to encode
     * @param {$protobuf.Writer} [writer] Writer to encode to
     * @returns {$protobuf.Writer} Writer
     */
    SphHiperfData.encodeDelimited = function encodeDelimited(message, writer) {
        return this.encode(message, writer).ldelim();
    };

    /**
     * Decodes a SphHiperfData message from the specified reader or buffer.
     * @function decode
     * @memberof SphHiperfData
     * @static
     * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
     * @param {number} [length] Message length if known beforehand
     * @returns {SphHiperfData} SphHiperfData
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    SphHiperfData.decode = function decode(reader, length) {
        if (!(reader instanceof $Reader))
            reader = $Reader.create(reader);
        var end = length === undefined ? reader.len : reader.pos + length, message = new $root.SphHiperfData();
        while (reader.pos < end) {
            var tag = reader.uint32();
            switch (tag >>> 3) {
            case 1: {
                    message.startNs = reader.int64();
                    break;
                }
            case 2: {
                    message.eventCount = reader.int64();
                    break;
                }
            case 3: {
                    message.sampleCount = reader.int64();
                    break;
                }
            case 4: {
                    message.eventTypeId = reader.int64();
                    break;
                }
            case 5: {
                    message.callchainId = reader.int64();
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
     * Decodes a SphHiperfData message from the specified reader or buffer, length delimited.
     * @function decodeDelimited
     * @memberof SphHiperfData
     * @static
     * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
     * @returns {SphHiperfData} SphHiperfData
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    SphHiperfData.decodeDelimited = function decodeDelimited(reader) {
        if (!(reader instanceof $Reader))
            reader = new $Reader(reader);
        return this.decode(reader, reader.uint32());
    };

    /**
     * Verifies a SphHiperfData message.
     * @function verify
     * @memberof SphHiperfData
     * @static
     * @param {Object.<string,*>} message Plain object to verify
     * @returns {string|null} `null` if valid, otherwise the reason why it is not
     */
    SphHiperfData.verify = function verify(message) {
        if (typeof message !== "object" || message === null)
            return "object expected";
        if (message.startNs != null && message.hasOwnProperty("startNs"))
            if (!$util.isInteger(message.startNs) && !(message.startNs && $util.isInteger(message.startNs.low) && $util.isInteger(message.startNs.high)))
                return "startNs: integer|Long expected";
        if (message.eventCount != null && message.hasOwnProperty("eventCount"))
            if (!$util.isInteger(message.eventCount) && !(message.eventCount && $util.isInteger(message.eventCount.low) && $util.isInteger(message.eventCount.high)))
                return "eventCount: integer|Long expected";
        if (message.sampleCount != null && message.hasOwnProperty("sampleCount"))
            if (!$util.isInteger(message.sampleCount) && !(message.sampleCount && $util.isInteger(message.sampleCount.low) && $util.isInteger(message.sampleCount.high)))
                return "sampleCount: integer|Long expected";
        if (message.eventTypeId != null && message.hasOwnProperty("eventTypeId"))
            if (!$util.isInteger(message.eventTypeId) && !(message.eventTypeId && $util.isInteger(message.eventTypeId.low) && $util.isInteger(message.eventTypeId.high)))
                return "eventTypeId: integer|Long expected";
        if (message.callchainId != null && message.hasOwnProperty("callchainId"))
            if (!$util.isInteger(message.callchainId) && !(message.callchainId && $util.isInteger(message.callchainId.low) && $util.isInteger(message.callchainId.high)))
                return "callchainId: integer|Long expected";
        return null;
    };

    /**
     * Creates a SphHiperfData message from a plain object. Also converts values to their respective internal types.
     * @function fromObject
     * @memberof SphHiperfData
     * @static
     * @param {Object.<string,*>} object Plain object
     * @returns {SphHiperfData} SphHiperfData
     */
    SphHiperfData.fromObject = function fromObject(object) {
        if (object instanceof $root.SphHiperfData)
            return object;
        var message = new $root.SphHiperfData();
        if (object.startNs != null)
            if ($util.Long)
                (message.startNs = $util.Long.fromValue(object.startNs)).unsigned = false;
            else if (typeof object.startNs === "string")
                message.startNs = parseInt(object.startNs, 10);
            else if (typeof object.startNs === "number")
                message.startNs = object.startNs;
            else if (typeof object.startNs === "object")
                message.startNs = new $util.LongBits(object.startNs.low >>> 0, object.startNs.high >>> 0).toNumber();
        if (object.eventCount != null)
            if ($util.Long)
                (message.eventCount = $util.Long.fromValue(object.eventCount)).unsigned = false;
            else if (typeof object.eventCount === "string")
                message.eventCount = parseInt(object.eventCount, 10);
            else if (typeof object.eventCount === "number")
                message.eventCount = object.eventCount;
            else if (typeof object.eventCount === "object")
                message.eventCount = new $util.LongBits(object.eventCount.low >>> 0, object.eventCount.high >>> 0).toNumber();
        if (object.sampleCount != null)
            if ($util.Long)
                (message.sampleCount = $util.Long.fromValue(object.sampleCount)).unsigned = false;
            else if (typeof object.sampleCount === "string")
                message.sampleCount = parseInt(object.sampleCount, 10);
            else if (typeof object.sampleCount === "number")
                message.sampleCount = object.sampleCount;
            else if (typeof object.sampleCount === "object")
                message.sampleCount = new $util.LongBits(object.sampleCount.low >>> 0, object.sampleCount.high >>> 0).toNumber();
        if (object.eventTypeId != null)
            if ($util.Long)
                (message.eventTypeId = $util.Long.fromValue(object.eventTypeId)).unsigned = false;
            else if (typeof object.eventTypeId === "string")
                message.eventTypeId = parseInt(object.eventTypeId, 10);
            else if (typeof object.eventTypeId === "number")
                message.eventTypeId = object.eventTypeId;
            else if (typeof object.eventTypeId === "object")
                message.eventTypeId = new $util.LongBits(object.eventTypeId.low >>> 0, object.eventTypeId.high >>> 0).toNumber();
        if (object.callchainId != null)
            if ($util.Long)
                (message.callchainId = $util.Long.fromValue(object.callchainId)).unsigned = false;
            else if (typeof object.callchainId === "string")
                message.callchainId = parseInt(object.callchainId, 10);
            else if (typeof object.callchainId === "number")
                message.callchainId = object.callchainId;
            else if (typeof object.callchainId === "object")
                message.callchainId = new $util.LongBits(object.callchainId.low >>> 0, object.callchainId.high >>> 0).toNumber();
        return message;
    };

    /**
     * Creates a plain object from a SphHiperfData message. Also converts values to other types if specified.
     * @function toObject
     * @memberof SphHiperfData
     * @static
     * @param {SphHiperfData} message SphHiperfData
     * @param {$protobuf.IConversionOptions} [options] Conversion options
     * @returns {Object.<string,*>} Plain object
     */
    SphHiperfData.toObject = function toObject(message, options) {
        if (!options)
            options = {};
        var object = {};
        if (options.defaults) {
            if ($util.Long) {
                var long = new $util.Long(0, 0, false);
                object.startNs = options.longs === String ? long.toString() : options.longs === Number ? long.toNumber() : long;
            } else
                object.startNs = options.longs === String ? "0" : 0;
            if ($util.Long) {
                var long = new $util.Long(0, 0, false);
                object.eventCount = options.longs === String ? long.toString() : options.longs === Number ? long.toNumber() : long;
            } else
                object.eventCount = options.longs === String ? "0" : 0;
            if ($util.Long) {
                var long = new $util.Long(0, 0, false);
                object.sampleCount = options.longs === String ? long.toString() : options.longs === Number ? long.toNumber() : long;
            } else
                object.sampleCount = options.longs === String ? "0" : 0;
            if ($util.Long) {
                var long = new $util.Long(0, 0, false);
                object.eventTypeId = options.longs === String ? long.toString() : options.longs === Number ? long.toNumber() : long;
            } else
                object.eventTypeId = options.longs === String ? "0" : 0;
            if ($util.Long) {
                var long = new $util.Long(0, 0, false);
                object.callchainId = options.longs === String ? long.toString() : options.longs === Number ? long.toNumber() : long;
            } else
                object.callchainId = options.longs === String ? "0" : 0;
        }
        if (message.startNs != null && message.hasOwnProperty("startNs"))
            if (typeof message.startNs === "number")
                object.startNs = options.longs === String ? String(message.startNs) : message.startNs;
            else
                object.startNs = options.longs === String ? $util.Long.prototype.toString.call(message.startNs) : options.longs === Number ? new $util.LongBits(message.startNs.low >>> 0, message.startNs.high >>> 0).toNumber() : message.startNs;
        if (message.eventCount != null && message.hasOwnProperty("eventCount"))
            if (typeof message.eventCount === "number")
                object.eventCount = options.longs === String ? String(message.eventCount) : message.eventCount;
            else
                object.eventCount = options.longs === String ? $util.Long.prototype.toString.call(message.eventCount) : options.longs === Number ? new $util.LongBits(message.eventCount.low >>> 0, message.eventCount.high >>> 0).toNumber() : message.eventCount;
        if (message.sampleCount != null && message.hasOwnProperty("sampleCount"))
            if (typeof message.sampleCount === "number")
                object.sampleCount = options.longs === String ? String(message.sampleCount) : message.sampleCount;
            else
                object.sampleCount = options.longs === String ? $util.Long.prototype.toString.call(message.sampleCount) : options.longs === Number ? new $util.LongBits(message.sampleCount.low >>> 0, message.sampleCount.high >>> 0).toNumber() : message.sampleCount;
        if (message.eventTypeId != null && message.hasOwnProperty("eventTypeId"))
            if (typeof message.eventTypeId === "number")
                object.eventTypeId = options.longs === String ? String(message.eventTypeId) : message.eventTypeId;
            else
                object.eventTypeId = options.longs === String ? $util.Long.prototype.toString.call(message.eventTypeId) : options.longs === Number ? new $util.LongBits(message.eventTypeId.low >>> 0, message.eventTypeId.high >>> 0).toNumber() : message.eventTypeId;
        if (message.callchainId != null && message.hasOwnProperty("callchainId"))
            if (typeof message.callchainId === "number")
                object.callchainId = options.longs === String ? String(message.callchainId) : message.callchainId;
            else
                object.callchainId = options.longs === String ? $util.Long.prototype.toString.call(message.callchainId) : options.longs === Number ? new $util.LongBits(message.callchainId.low >>> 0, message.callchainId.high >>> 0).toNumber() : message.callchainId;
        return object;
    };

    /**
     * Converts this SphHiperfData to JSON.
     * @function toJSON
     * @memberof SphHiperfData
     * @instance
     * @returns {Object.<string,*>} JSON object
     */
    SphHiperfData.prototype.toJSON = function toJSON() {
        return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
    };

    /**
     * Gets the default type url for SphHiperfData
     * @function getTypeUrl
     * @memberof SphHiperfData
     * @static
     * @param {string} [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
     * @returns {string} The default type url
     */
    SphHiperfData.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
        if (typeUrlPrefix === undefined) {
            typeUrlPrefix = "type.googleapis.com";
        }
        return typeUrlPrefix + "/SphHiperfData";
    };

    return SphHiperfData;
})();

$root.SphHiperfCallChartData = (function() {

    /**
     * Properties of a SphHiperfCallChartData.
     * @exports ISphHiperfCallChartData
     * @interface ISphHiperfCallChartData
     * @property {number|Long|null} [callchainId] SphHiperfCallChartData callchainId
     * @property {number|Long|null} [startTs] SphHiperfCallChartData startTs
     * @property {number|Long|null} [eventCount] SphHiperfCallChartData eventCount
     * @property {number|Long|null} [threadId] SphHiperfCallChartData threadId
     * @property {number|Long|null} [cpuId] SphHiperfCallChartData cpuId
     * @property {number|Long|null} [eventTypeId] SphHiperfCallChartData eventTypeId
     */

    /**
     * Constructs a new SphHiperfCallChartData.
     * @exports SphHiperfCallChartData
     * @classdesc Represents a SphHiperfCallChartData.
     * @implements ISphHiperfCallChartData
     * @constructor
     * @param {ISphHiperfCallChartData=} [properties] Properties to set
     */
    function SphHiperfCallChartData(properties) {
        if (properties)
            for (var keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                if (properties[keys[i]] != null)
                    this[keys[i]] = properties[keys[i]];
    }

    /**
     * SphHiperfCallChartData callchainId.
     * @member {number|Long} callchainId
     * @memberof SphHiperfCallChartData
     * @instance
     */
    SphHiperfCallChartData.prototype.callchainId = $util.Long ? $util.Long.fromBits(0,0,false) : 0;

    /**
     * SphHiperfCallChartData startTs.
     * @member {number|Long} startTs
     * @memberof SphHiperfCallChartData
     * @instance
     */
    SphHiperfCallChartData.prototype.startTs = $util.Long ? $util.Long.fromBits(0,0,false) : 0;

    /**
     * SphHiperfCallChartData eventCount.
     * @member {number|Long} eventCount
     * @memberof SphHiperfCallChartData
     * @instance
     */
    SphHiperfCallChartData.prototype.eventCount = $util.Long ? $util.Long.fromBits(0,0,false) : 0;

    /**
     * SphHiperfCallChartData threadId.
     * @member {number|Long} threadId
     * @memberof SphHiperfCallChartData
     * @instance
     */
    SphHiperfCallChartData.prototype.threadId = $util.Long ? $util.Long.fromBits(0,0,false) : 0;

    /**
     * SphHiperfCallChartData cpuId.
     * @member {number|Long} cpuId
     * @memberof SphHiperfCallChartData
     * @instance
     */
    SphHiperfCallChartData.prototype.cpuId = $util.Long ? $util.Long.fromBits(0,0,false) : 0;

    /**
     * SphHiperfCallChartData eventTypeId.
     * @member {number|Long} eventTypeId
     * @memberof SphHiperfCallChartData
     * @instance
     */
    SphHiperfCallChartData.prototype.eventTypeId = $util.Long ? $util.Long.fromBits(0,0,false) : 0;

    /**
     * Creates a new SphHiperfCallChartData instance using the specified properties.
     * @function create
     * @memberof SphHiperfCallChartData
     * @static
     * @param {ISphHiperfCallChartData=} [properties] Properties to set
     * @returns {SphHiperfCallChartData} SphHiperfCallChartData instance
     */
    SphHiperfCallChartData.create = function create(properties) {
        return new SphHiperfCallChartData(properties);
    };

    /**
     * Encodes the specified SphHiperfCallChartData message. Does not implicitly {@link SphHiperfCallChartData.verify|verify} messages.
     * @function encode
     * @memberof SphHiperfCallChartData
     * @static
     * @param {ISphHiperfCallChartData} message SphHiperfCallChartData message or plain object to encode
     * @param {$protobuf.Writer} [writer] Writer to encode to
     * @returns {$protobuf.Writer} Writer
     */
    SphHiperfCallChartData.encode = function encode(message, writer) {
        if (!writer)
            writer = $Writer.create();
        if (message.callchainId != null && Object.hasOwnProperty.call(message, "callchainId"))
            writer.uint32(/* id 1, wireType 0 =*/8).int64(message.callchainId);
        if (message.startTs != null && Object.hasOwnProperty.call(message, "startTs"))
            writer.uint32(/* id 2, wireType 0 =*/16).int64(message.startTs);
        if (message.eventCount != null && Object.hasOwnProperty.call(message, "eventCount"))
            writer.uint32(/* id 3, wireType 0 =*/24).int64(message.eventCount);
        if (message.threadId != null && Object.hasOwnProperty.call(message, "threadId"))
            writer.uint32(/* id 4, wireType 0 =*/32).int64(message.threadId);
        if (message.cpuId != null && Object.hasOwnProperty.call(message, "cpuId"))
            writer.uint32(/* id 5, wireType 0 =*/40).int64(message.cpuId);
        if (message.eventTypeId != null && Object.hasOwnProperty.call(message, "eventTypeId"))
            writer.uint32(/* id 6, wireType 0 =*/48).int64(message.eventTypeId);
        return writer;
    };

    /**
     * Encodes the specified SphHiperfCallChartData message, length delimited. Does not implicitly {@link SphHiperfCallChartData.verify|verify} messages.
     * @function encodeDelimited
     * @memberof SphHiperfCallChartData
     * @static
     * @param {ISphHiperfCallChartData} message SphHiperfCallChartData message or plain object to encode
     * @param {$protobuf.Writer} [writer] Writer to encode to
     * @returns {$protobuf.Writer} Writer
     */
    SphHiperfCallChartData.encodeDelimited = function encodeDelimited(message, writer) {
        return this.encode(message, writer).ldelim();
    };

    /**
     * Decodes a SphHiperfCallChartData message from the specified reader or buffer.
     * @function decode
     * @memberof SphHiperfCallChartData
     * @static
     * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
     * @param {number} [length] Message length if known beforehand
     * @returns {SphHiperfCallChartData} SphHiperfCallChartData
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    SphHiperfCallChartData.decode = function decode(reader, length) {
        if (!(reader instanceof $Reader))
            reader = $Reader.create(reader);
        var end = length === undefined ? reader.len : reader.pos + length, message = new $root.SphHiperfCallChartData();
        while (reader.pos < end) {
            var tag = reader.uint32();
            switch (tag >>> 3) {
            case 1: {
                    message.callchainId = reader.int64();
                    break;
                }
            case 2: {
                    message.startTs = reader.int64();
                    break;
                }
            case 3: {
                    message.eventCount = reader.int64();
                    break;
                }
            case 4: {
                    message.threadId = reader.int64();
                    break;
                }
            case 5: {
                    message.cpuId = reader.int64();
                    break;
                }
            case 6: {
                    message.eventTypeId = reader.int64();
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
     * Decodes a SphHiperfCallChartData message from the specified reader or buffer, length delimited.
     * @function decodeDelimited
     * @memberof SphHiperfCallChartData
     * @static
     * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
     * @returns {SphHiperfCallChartData} SphHiperfCallChartData
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    SphHiperfCallChartData.decodeDelimited = function decodeDelimited(reader) {
        if (!(reader instanceof $Reader))
            reader = new $Reader(reader);
        return this.decode(reader, reader.uint32());
    };

    /**
     * Verifies a SphHiperfCallChartData message.
     * @function verify
     * @memberof SphHiperfCallChartData
     * @static
     * @param {Object.<string,*>} message Plain object to verify
     * @returns {string|null} `null` if valid, otherwise the reason why it is not
     */
    SphHiperfCallChartData.verify = function verify(message) {
        if (typeof message !== "object" || message === null)
            return "object expected";
        if (message.callchainId != null && message.hasOwnProperty("callchainId"))
            if (!$util.isInteger(message.callchainId) && !(message.callchainId && $util.isInteger(message.callchainId.low) && $util.isInteger(message.callchainId.high)))
                return "callchainId: integer|Long expected";
        if (message.startTs != null && message.hasOwnProperty("startTs"))
            if (!$util.isInteger(message.startTs) && !(message.startTs && $util.isInteger(message.startTs.low) && $util.isInteger(message.startTs.high)))
                return "startTs: integer|Long expected";
        if (message.eventCount != null && message.hasOwnProperty("eventCount"))
            if (!$util.isInteger(message.eventCount) && !(message.eventCount && $util.isInteger(message.eventCount.low) && $util.isInteger(message.eventCount.high)))
                return "eventCount: integer|Long expected";
        if (message.threadId != null && message.hasOwnProperty("threadId"))
            if (!$util.isInteger(message.threadId) && !(message.threadId && $util.isInteger(message.threadId.low) && $util.isInteger(message.threadId.high)))
                return "threadId: integer|Long expected";
        if (message.cpuId != null && message.hasOwnProperty("cpuId"))
            if (!$util.isInteger(message.cpuId) && !(message.cpuId && $util.isInteger(message.cpuId.low) && $util.isInteger(message.cpuId.high)))
                return "cpuId: integer|Long expected";
        if (message.eventTypeId != null && message.hasOwnProperty("eventTypeId"))
            if (!$util.isInteger(message.eventTypeId) && !(message.eventTypeId && $util.isInteger(message.eventTypeId.low) && $util.isInteger(message.eventTypeId.high)))
                return "eventTypeId: integer|Long expected";
        return null;
    };

    /**
     * Creates a SphHiperfCallChartData message from a plain object. Also converts values to their respective internal types.
     * @function fromObject
     * @memberof SphHiperfCallChartData
     * @static
     * @param {Object.<string,*>} object Plain object
     * @returns {SphHiperfCallChartData} SphHiperfCallChartData
     */
    SphHiperfCallChartData.fromObject = function fromObject(object) {
        if (object instanceof $root.SphHiperfCallChartData)
            return object;
        var message = new $root.SphHiperfCallChartData();
        if (object.callchainId != null)
            if ($util.Long)
                (message.callchainId = $util.Long.fromValue(object.callchainId)).unsigned = false;
            else if (typeof object.callchainId === "string")
                message.callchainId = parseInt(object.callchainId, 10);
            else if (typeof object.callchainId === "number")
                message.callchainId = object.callchainId;
            else if (typeof object.callchainId === "object")
                message.callchainId = new $util.LongBits(object.callchainId.low >>> 0, object.callchainId.high >>> 0).toNumber();
        if (object.startTs != null)
            if ($util.Long)
                (message.startTs = $util.Long.fromValue(object.startTs)).unsigned = false;
            else if (typeof object.startTs === "string")
                message.startTs = parseInt(object.startTs, 10);
            else if (typeof object.startTs === "number")
                message.startTs = object.startTs;
            else if (typeof object.startTs === "object")
                message.startTs = new $util.LongBits(object.startTs.low >>> 0, object.startTs.high >>> 0).toNumber();
        if (object.eventCount != null)
            if ($util.Long)
                (message.eventCount = $util.Long.fromValue(object.eventCount)).unsigned = false;
            else if (typeof object.eventCount === "string")
                message.eventCount = parseInt(object.eventCount, 10);
            else if (typeof object.eventCount === "number")
                message.eventCount = object.eventCount;
            else if (typeof object.eventCount === "object")
                message.eventCount = new $util.LongBits(object.eventCount.low >>> 0, object.eventCount.high >>> 0).toNumber();
        if (object.threadId != null)
            if ($util.Long)
                (message.threadId = $util.Long.fromValue(object.threadId)).unsigned = false;
            else if (typeof object.threadId === "string")
                message.threadId = parseInt(object.threadId, 10);
            else if (typeof object.threadId === "number")
                message.threadId = object.threadId;
            else if (typeof object.threadId === "object")
                message.threadId = new $util.LongBits(object.threadId.low >>> 0, object.threadId.high >>> 0).toNumber();
        if (object.cpuId != null)
            if ($util.Long)
                (message.cpuId = $util.Long.fromValue(object.cpuId)).unsigned = false;
            else if (typeof object.cpuId === "string")
                message.cpuId = parseInt(object.cpuId, 10);
            else if (typeof object.cpuId === "number")
                message.cpuId = object.cpuId;
            else if (typeof object.cpuId === "object")
                message.cpuId = new $util.LongBits(object.cpuId.low >>> 0, object.cpuId.high >>> 0).toNumber();
        if (object.eventTypeId != null)
            if ($util.Long)
                (message.eventTypeId = $util.Long.fromValue(object.eventTypeId)).unsigned = false;
            else if (typeof object.eventTypeId === "string")
                message.eventTypeId = parseInt(object.eventTypeId, 10);
            else if (typeof object.eventTypeId === "number")
                message.eventTypeId = object.eventTypeId;
            else if (typeof object.eventTypeId === "object")
                message.eventTypeId = new $util.LongBits(object.eventTypeId.low >>> 0, object.eventTypeId.high >>> 0).toNumber();
        return message;
    };

    /**
     * Creates a plain object from a SphHiperfCallChartData message. Also converts values to other types if specified.
     * @function toObject
     * @memberof SphHiperfCallChartData
     * @static
     * @param {SphHiperfCallChartData} message SphHiperfCallChartData
     * @param {$protobuf.IConversionOptions} [options] Conversion options
     * @returns {Object.<string,*>} Plain object
     */
    SphHiperfCallChartData.toObject = function toObject(message, options) {
        if (!options)
            options = {};
        var object = {};
        if (options.defaults) {
            if ($util.Long) {
                var long = new $util.Long(0, 0, false);
                object.callchainId = options.longs === String ? long.toString() : options.longs === Number ? long.toNumber() : long;
            } else
                object.callchainId = options.longs === String ? "0" : 0;
            if ($util.Long) {
                var long = new $util.Long(0, 0, false);
                object.startTs = options.longs === String ? long.toString() : options.longs === Number ? long.toNumber() : long;
            } else
                object.startTs = options.longs === String ? "0" : 0;
            if ($util.Long) {
                var long = new $util.Long(0, 0, false);
                object.eventCount = options.longs === String ? long.toString() : options.longs === Number ? long.toNumber() : long;
            } else
                object.eventCount = options.longs === String ? "0" : 0;
            if ($util.Long) {
                var long = new $util.Long(0, 0, false);
                object.threadId = options.longs === String ? long.toString() : options.longs === Number ? long.toNumber() : long;
            } else
                object.threadId = options.longs === String ? "0" : 0;
            if ($util.Long) {
                var long = new $util.Long(0, 0, false);
                object.cpuId = options.longs === String ? long.toString() : options.longs === Number ? long.toNumber() : long;
            } else
                object.cpuId = options.longs === String ? "0" : 0;
            if ($util.Long) {
                var long = new $util.Long(0, 0, false);
                object.eventTypeId = options.longs === String ? long.toString() : options.longs === Number ? long.toNumber() : long;
            } else
                object.eventTypeId = options.longs === String ? "0" : 0;
        }
        if (message.callchainId != null && message.hasOwnProperty("callchainId"))
            if (typeof message.callchainId === "number")
                object.callchainId = options.longs === String ? String(message.callchainId) : message.callchainId;
            else
                object.callchainId = options.longs === String ? $util.Long.prototype.toString.call(message.callchainId) : options.longs === Number ? new $util.LongBits(message.callchainId.low >>> 0, message.callchainId.high >>> 0).toNumber() : message.callchainId;
        if (message.startTs != null && message.hasOwnProperty("startTs"))
            if (typeof message.startTs === "number")
                object.startTs = options.longs === String ? String(message.startTs) : message.startTs;
            else
                object.startTs = options.longs === String ? $util.Long.prototype.toString.call(message.startTs) : options.longs === Number ? new $util.LongBits(message.startTs.low >>> 0, message.startTs.high >>> 0).toNumber() : message.startTs;
        if (message.eventCount != null && message.hasOwnProperty("eventCount"))
            if (typeof message.eventCount === "number")
                object.eventCount = options.longs === String ? String(message.eventCount) : message.eventCount;
            else
                object.eventCount = options.longs === String ? $util.Long.prototype.toString.call(message.eventCount) : options.longs === Number ? new $util.LongBits(message.eventCount.low >>> 0, message.eventCount.high >>> 0).toNumber() : message.eventCount;
        if (message.threadId != null && message.hasOwnProperty("threadId"))
            if (typeof message.threadId === "number")
                object.threadId = options.longs === String ? String(message.threadId) : message.threadId;
            else
                object.threadId = options.longs === String ? $util.Long.prototype.toString.call(message.threadId) : options.longs === Number ? new $util.LongBits(message.threadId.low >>> 0, message.threadId.high >>> 0).toNumber() : message.threadId;
        if (message.cpuId != null && message.hasOwnProperty("cpuId"))
            if (typeof message.cpuId === "number")
                object.cpuId = options.longs === String ? String(message.cpuId) : message.cpuId;
            else
                object.cpuId = options.longs === String ? $util.Long.prototype.toString.call(message.cpuId) : options.longs === Number ? new $util.LongBits(message.cpuId.low >>> 0, message.cpuId.high >>> 0).toNumber() : message.cpuId;
        if (message.eventTypeId != null && message.hasOwnProperty("eventTypeId"))
            if (typeof message.eventTypeId === "number")
                object.eventTypeId = options.longs === String ? String(message.eventTypeId) : message.eventTypeId;
            else
                object.eventTypeId = options.longs === String ? $util.Long.prototype.toString.call(message.eventTypeId) : options.longs === Number ? new $util.LongBits(message.eventTypeId.low >>> 0, message.eventTypeId.high >>> 0).toNumber() : message.eventTypeId;
        return object;
    };

    /**
     * Converts this SphHiperfCallChartData to JSON.
     * @function toJSON
     * @memberof SphHiperfCallChartData
     * @instance
     * @returns {Object.<string,*>} JSON object
     */
    SphHiperfCallChartData.prototype.toJSON = function toJSON() {
        return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
    };

    /**
     * Gets the default type url for SphHiperfCallChartData
     * @function getTypeUrl
     * @memberof SphHiperfCallChartData
     * @static
     * @param {string} [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
     * @returns {string} The default type url
     */
    SphHiperfCallChartData.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
        if (typeUrlPrefix === undefined) {
            typeUrlPrefix = "type.googleapis.com";
        }
        return typeUrlPrefix + "/SphHiperfCallChartData";
    };

    return SphHiperfCallChartData;
})();

$root.SphHiperfCallStackData = (function() {

    /**
     * Properties of a SphHiperfCallStackData.
     * @exports ISphHiperfCallStackData
     * @interface ISphHiperfCallStackData
     * @property {number|Long|null} [callchainId] SphHiperfCallStackData callchainId
     * @property {number|Long|null} [fileId] SphHiperfCallStackData fileId
     * @property {number|Long|null} [depth] SphHiperfCallStackData depth
     * @property {number|Long|null} [symbolId] SphHiperfCallStackData symbolId
     * @property {number|Long|null} [name] SphHiperfCallStackData name
     */

    /**
     * Constructs a new SphHiperfCallStackData.
     * @exports SphHiperfCallStackData
     * @classdesc Represents a SphHiperfCallStackData.
     * @implements ISphHiperfCallStackData
     * @constructor
     * @param {ISphHiperfCallStackData=} [properties] Properties to set
     */
    function SphHiperfCallStackData(properties) {
        if (properties)
            for (var keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                if (properties[keys[i]] != null)
                    this[keys[i]] = properties[keys[i]];
    }

    /**
     * SphHiperfCallStackData callchainId.
     * @member {number|Long} callchainId
     * @memberof SphHiperfCallStackData
     * @instance
     */
    SphHiperfCallStackData.prototype.callchainId = $util.Long ? $util.Long.fromBits(0,0,false) : 0;

    /**
     * SphHiperfCallStackData fileId.
     * @member {number|Long} fileId
     * @memberof SphHiperfCallStackData
     * @instance
     */
    SphHiperfCallStackData.prototype.fileId = $util.Long ? $util.Long.fromBits(0,0,false) : 0;

    /**
     * SphHiperfCallStackData depth.
     * @member {number|Long} depth
     * @memberof SphHiperfCallStackData
     * @instance
     */
    SphHiperfCallStackData.prototype.depth = $util.Long ? $util.Long.fromBits(0,0,false) : 0;

    /**
     * SphHiperfCallStackData symbolId.
     * @member {number|Long} symbolId
     * @memberof SphHiperfCallStackData
     * @instance
     */
    SphHiperfCallStackData.prototype.symbolId = $util.Long ? $util.Long.fromBits(0,0,false) : 0;

    /**
     * SphHiperfCallStackData name.
     * @member {number|Long} name
     * @memberof SphHiperfCallStackData
     * @instance
     */
    SphHiperfCallStackData.prototype.name = $util.Long ? $util.Long.fromBits(0,0,false) : 0;

    /**
     * Creates a new SphHiperfCallStackData instance using the specified properties.
     * @function create
     * @memberof SphHiperfCallStackData
     * @static
     * @param {ISphHiperfCallStackData=} [properties] Properties to set
     * @returns {SphHiperfCallStackData} SphHiperfCallStackData instance
     */
    SphHiperfCallStackData.create = function create(properties) {
        return new SphHiperfCallStackData(properties);
    };

    /**
     * Encodes the specified SphHiperfCallStackData message. Does not implicitly {@link SphHiperfCallStackData.verify|verify} messages.
     * @function encode
     * @memberof SphHiperfCallStackData
     * @static
     * @param {ISphHiperfCallStackData} message SphHiperfCallStackData message or plain object to encode
     * @param {$protobuf.Writer} [writer] Writer to encode to
     * @returns {$protobuf.Writer} Writer
     */
    SphHiperfCallStackData.encode = function encode(message, writer) {
        if (!writer)
            writer = $Writer.create();
        if (message.callchainId != null && Object.hasOwnProperty.call(message, "callchainId"))
            writer.uint32(/* id 1, wireType 0 =*/8).int64(message.callchainId);
        if (message.fileId != null && Object.hasOwnProperty.call(message, "fileId"))
            writer.uint32(/* id 2, wireType 0 =*/16).int64(message.fileId);
        if (message.depth != null && Object.hasOwnProperty.call(message, "depth"))
            writer.uint32(/* id 3, wireType 0 =*/24).int64(message.depth);
        if (message.symbolId != null && Object.hasOwnProperty.call(message, "symbolId"))
            writer.uint32(/* id 4, wireType 0 =*/32).int64(message.symbolId);
        if (message.name != null && Object.hasOwnProperty.call(message, "name"))
            writer.uint32(/* id 5, wireType 0 =*/40).int64(message.name);
        return writer;
    };

    /**
     * Encodes the specified SphHiperfCallStackData message, length delimited. Does not implicitly {@link SphHiperfCallStackData.verify|verify} messages.
     * @function encodeDelimited
     * @memberof SphHiperfCallStackData
     * @static
     * @param {ISphHiperfCallStackData} message SphHiperfCallStackData message or plain object to encode
     * @param {$protobuf.Writer} [writer] Writer to encode to
     * @returns {$protobuf.Writer} Writer
     */
    SphHiperfCallStackData.encodeDelimited = function encodeDelimited(message, writer) {
        return this.encode(message, writer).ldelim();
    };

    /**
     * Decodes a SphHiperfCallStackData message from the specified reader or buffer.
     * @function decode
     * @memberof SphHiperfCallStackData
     * @static
     * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
     * @param {number} [length] Message length if known beforehand
     * @returns {SphHiperfCallStackData} SphHiperfCallStackData
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    SphHiperfCallStackData.decode = function decode(reader, length) {
        if (!(reader instanceof $Reader))
            reader = $Reader.create(reader);
        var end = length === undefined ? reader.len : reader.pos + length, message = new $root.SphHiperfCallStackData();
        while (reader.pos < end) {
            var tag = reader.uint32();
            switch (tag >>> 3) {
            case 1: {
                    message.callchainId = reader.int64();
                    break;
                }
            case 2: {
                    message.fileId = reader.int64();
                    break;
                }
            case 3: {
                    message.depth = reader.int64();
                    break;
                }
            case 4: {
                    message.symbolId = reader.int64();
                    break;
                }
            case 5: {
                    message.name = reader.int64();
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
     * Decodes a SphHiperfCallStackData message from the specified reader or buffer, length delimited.
     * @function decodeDelimited
     * @memberof SphHiperfCallStackData
     * @static
     * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
     * @returns {SphHiperfCallStackData} SphHiperfCallStackData
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    SphHiperfCallStackData.decodeDelimited = function decodeDelimited(reader) {
        if (!(reader instanceof $Reader))
            reader = new $Reader(reader);
        return this.decode(reader, reader.uint32());
    };

    /**
     * Verifies a SphHiperfCallStackData message.
     * @function verify
     * @memberof SphHiperfCallStackData
     * @static
     * @param {Object.<string,*>} message Plain object to verify
     * @returns {string|null} `null` if valid, otherwise the reason why it is not
     */
    SphHiperfCallStackData.verify = function verify(message) {
        if (typeof message !== "object" || message === null)
            return "object expected";
        if (message.callchainId != null && message.hasOwnProperty("callchainId"))
            if (!$util.isInteger(message.callchainId) && !(message.callchainId && $util.isInteger(message.callchainId.low) && $util.isInteger(message.callchainId.high)))
                return "callchainId: integer|Long expected";
        if (message.fileId != null && message.hasOwnProperty("fileId"))
            if (!$util.isInteger(message.fileId) && !(message.fileId && $util.isInteger(message.fileId.low) && $util.isInteger(message.fileId.high)))
                return "fileId: integer|Long expected";
        if (message.depth != null && message.hasOwnProperty("depth"))
            if (!$util.isInteger(message.depth) && !(message.depth && $util.isInteger(message.depth.low) && $util.isInteger(message.depth.high)))
                return "depth: integer|Long expected";
        if (message.symbolId != null && message.hasOwnProperty("symbolId"))
            if (!$util.isInteger(message.symbolId) && !(message.symbolId && $util.isInteger(message.symbolId.low) && $util.isInteger(message.symbolId.high)))
                return "symbolId: integer|Long expected";
        if (message.name != null && message.hasOwnProperty("name"))
            if (!$util.isInteger(message.name) && !(message.name && $util.isInteger(message.name.low) && $util.isInteger(message.name.high)))
                return "name: integer|Long expected";
        return null;
    };

    /**
     * Creates a SphHiperfCallStackData message from a plain object. Also converts values to their respective internal types.
     * @function fromObject
     * @memberof SphHiperfCallStackData
     * @static
     * @param {Object.<string,*>} object Plain object
     * @returns {SphHiperfCallStackData} SphHiperfCallStackData
     */
    SphHiperfCallStackData.fromObject = function fromObject(object) {
        if (object instanceof $root.SphHiperfCallStackData)
            return object;
        var message = new $root.SphHiperfCallStackData();
        if (object.callchainId != null)
            if ($util.Long)
                (message.callchainId = $util.Long.fromValue(object.callchainId)).unsigned = false;
            else if (typeof object.callchainId === "string")
                message.callchainId = parseInt(object.callchainId, 10);
            else if (typeof object.callchainId === "number")
                message.callchainId = object.callchainId;
            else if (typeof object.callchainId === "object")
                message.callchainId = new $util.LongBits(object.callchainId.low >>> 0, object.callchainId.high >>> 0).toNumber();
        if (object.fileId != null)
            if ($util.Long)
                (message.fileId = $util.Long.fromValue(object.fileId)).unsigned = false;
            else if (typeof object.fileId === "string")
                message.fileId = parseInt(object.fileId, 10);
            else if (typeof object.fileId === "number")
                message.fileId = object.fileId;
            else if (typeof object.fileId === "object")
                message.fileId = new $util.LongBits(object.fileId.low >>> 0, object.fileId.high >>> 0).toNumber();
        if (object.depth != null)
            if ($util.Long)
                (message.depth = $util.Long.fromValue(object.depth)).unsigned = false;
            else if (typeof object.depth === "string")
                message.depth = parseInt(object.depth, 10);
            else if (typeof object.depth === "number")
                message.depth = object.depth;
            else if (typeof object.depth === "object")
                message.depth = new $util.LongBits(object.depth.low >>> 0, object.depth.high >>> 0).toNumber();
        if (object.symbolId != null)
            if ($util.Long)
                (message.symbolId = $util.Long.fromValue(object.symbolId)).unsigned = false;
            else if (typeof object.symbolId === "string")
                message.symbolId = parseInt(object.symbolId, 10);
            else if (typeof object.symbolId === "number")
                message.symbolId = object.symbolId;
            else if (typeof object.symbolId === "object")
                message.symbolId = new $util.LongBits(object.symbolId.low >>> 0, object.symbolId.high >>> 0).toNumber();
        if (object.name != null)
            if ($util.Long)
                (message.name = $util.Long.fromValue(object.name)).unsigned = false;
            else if (typeof object.name === "string")
                message.name = parseInt(object.name, 10);
            else if (typeof object.name === "number")
                message.name = object.name;
            else if (typeof object.name === "object")
                message.name = new $util.LongBits(object.name.low >>> 0, object.name.high >>> 0).toNumber();
        return message;
    };

    /**
     * Creates a plain object from a SphHiperfCallStackData message. Also converts values to other types if specified.
     * @function toObject
     * @memberof SphHiperfCallStackData
     * @static
     * @param {SphHiperfCallStackData} message SphHiperfCallStackData
     * @param {$protobuf.IConversionOptions} [options] Conversion options
     * @returns {Object.<string,*>} Plain object
     */
    SphHiperfCallStackData.toObject = function toObject(message, options) {
        if (!options)
            options = {};
        var object = {};
        if (options.defaults) {
            if ($util.Long) {
                var long = new $util.Long(0, 0, false);
                object.callchainId = options.longs === String ? long.toString() : options.longs === Number ? long.toNumber() : long;
            } else
                object.callchainId = options.longs === String ? "0" : 0;
            if ($util.Long) {
                var long = new $util.Long(0, 0, false);
                object.fileId = options.longs === String ? long.toString() : options.longs === Number ? long.toNumber() : long;
            } else
                object.fileId = options.longs === String ? "0" : 0;
            if ($util.Long) {
                var long = new $util.Long(0, 0, false);
                object.depth = options.longs === String ? long.toString() : options.longs === Number ? long.toNumber() : long;
            } else
                object.depth = options.longs === String ? "0" : 0;
            if ($util.Long) {
                var long = new $util.Long(0, 0, false);
                object.symbolId = options.longs === String ? long.toString() : options.longs === Number ? long.toNumber() : long;
            } else
                object.symbolId = options.longs === String ? "0" : 0;
            if ($util.Long) {
                var long = new $util.Long(0, 0, false);
                object.name = options.longs === String ? long.toString() : options.longs === Number ? long.toNumber() : long;
            } else
                object.name = options.longs === String ? "0" : 0;
        }
        if (message.callchainId != null && message.hasOwnProperty("callchainId"))
            if (typeof message.callchainId === "number")
                object.callchainId = options.longs === String ? String(message.callchainId) : message.callchainId;
            else
                object.callchainId = options.longs === String ? $util.Long.prototype.toString.call(message.callchainId) : options.longs === Number ? new $util.LongBits(message.callchainId.low >>> 0, message.callchainId.high >>> 0).toNumber() : message.callchainId;
        if (message.fileId != null && message.hasOwnProperty("fileId"))
            if (typeof message.fileId === "number")
                object.fileId = options.longs === String ? String(message.fileId) : message.fileId;
            else
                object.fileId = options.longs === String ? $util.Long.prototype.toString.call(message.fileId) : options.longs === Number ? new $util.LongBits(message.fileId.low >>> 0, message.fileId.high >>> 0).toNumber() : message.fileId;
        if (message.depth != null && message.hasOwnProperty("depth"))
            if (typeof message.depth === "number")
                object.depth = options.longs === String ? String(message.depth) : message.depth;
            else
                object.depth = options.longs === String ? $util.Long.prototype.toString.call(message.depth) : options.longs === Number ? new $util.LongBits(message.depth.low >>> 0, message.depth.high >>> 0).toNumber() : message.depth;
        if (message.symbolId != null && message.hasOwnProperty("symbolId"))
            if (typeof message.symbolId === "number")
                object.symbolId = options.longs === String ? String(message.symbolId) : message.symbolId;
            else
                object.symbolId = options.longs === String ? $util.Long.prototype.toString.call(message.symbolId) : options.longs === Number ? new $util.LongBits(message.symbolId.low >>> 0, message.symbolId.high >>> 0).toNumber() : message.symbolId;
        if (message.name != null && message.hasOwnProperty("name"))
            if (typeof message.name === "number")
                object.name = options.longs === String ? String(message.name) : message.name;
            else
                object.name = options.longs === String ? $util.Long.prototype.toString.call(message.name) : options.longs === Number ? new $util.LongBits(message.name.low >>> 0, message.name.high >>> 0).toNumber() : message.name;
        return object;
    };

    /**
     * Converts this SphHiperfCallStackData to JSON.
     * @function toJSON
     * @memberof SphHiperfCallStackData
     * @instance
     * @returns {Object.<string,*>} JSON object
     */
    SphHiperfCallStackData.prototype.toJSON = function toJSON() {
        return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
    };

    /**
     * Gets the default type url for SphHiperfCallStackData
     * @function getTypeUrl
     * @memberof SphHiperfCallStackData
     * @static
     * @param {string} [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
     * @returns {string} The default type url
     */
    SphHiperfCallStackData.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
        if (typeUrlPrefix === undefined) {
            typeUrlPrefix = "type.googleapis.com";
        }
        return typeUrlPrefix + "/SphHiperfCallStackData";
    };

    return SphHiperfCallStackData;
})();

$root.SphProcessThreadData = (function() {

    /**
     * Properties of a SphProcessThreadData.
     * @exports ISphProcessThreadData
     * @interface ISphProcessThreadData
     * @property {number|null} [cpu] SphProcessThreadData cpu
     * @property {number|Long|null} [dur] SphProcessThreadData dur
     * @property {number|Long|null} [id] SphProcessThreadData id
     * @property {number|Long|null} [tid] SphProcessThreadData tid
     * @property {string|null} [state] SphProcessThreadData state
     * @property {number|Long|null} [pid] SphProcessThreadData pid
     * @property {number|Long|null} [startTime] SphProcessThreadData startTime
     * @property {number|Long|null} [argSetId] SphProcessThreadData argSetId
     */

    /**
     * Constructs a new SphProcessThreadData.
     * @exports SphProcessThreadData
     * @classdesc Represents a SphProcessThreadData.
     * @implements ISphProcessThreadData
     * @constructor
     * @param {ISphProcessThreadData=} [properties] Properties to set
     */
    function SphProcessThreadData(properties) {
        if (properties)
            for (var keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                if (properties[keys[i]] != null)
                    this[keys[i]] = properties[keys[i]];
    }

    /**
     * SphProcessThreadData cpu.
     * @member {number} cpu
     * @memberof SphProcessThreadData
     * @instance
     */
    SphProcessThreadData.prototype.cpu = 0;

    /**
     * SphProcessThreadData dur.
     * @member {number|Long} dur
     * @memberof SphProcessThreadData
     * @instance
     */
    SphProcessThreadData.prototype.dur = $util.Long ? $util.Long.fromBits(0,0,false) : 0;

    /**
     * SphProcessThreadData id.
     * @member {number|Long} id
     * @memberof SphProcessThreadData
     * @instance
     */
    SphProcessThreadData.prototype.id = $util.Long ? $util.Long.fromBits(0,0,false) : 0;

    /**
     * SphProcessThreadData tid.
     * @member {number|Long} tid
     * @memberof SphProcessThreadData
     * @instance
     */
    SphProcessThreadData.prototype.tid = $util.Long ? $util.Long.fromBits(0,0,false) : 0;

    /**
     * SphProcessThreadData state.
     * @member {string} state
     * @memberof SphProcessThreadData
     * @instance
     */
    SphProcessThreadData.prototype.state = "";

    /**
     * SphProcessThreadData pid.
     * @member {number|Long} pid
     * @memberof SphProcessThreadData
     * @instance
     */
    SphProcessThreadData.prototype.pid = $util.Long ? $util.Long.fromBits(0,0,false) : 0;

    /**
     * SphProcessThreadData startTime.
     * @member {number|Long} startTime
     * @memberof SphProcessThreadData
     * @instance
     */
    SphProcessThreadData.prototype.startTime = $util.Long ? $util.Long.fromBits(0,0,false) : 0;

    /**
     * SphProcessThreadData argSetId.
     * @member {number|Long} argSetId
     * @memberof SphProcessThreadData
     * @instance
     */
    SphProcessThreadData.prototype.argSetId = $util.Long ? $util.Long.fromBits(0,0,false) : 0;

    /**
     * Creates a new SphProcessThreadData instance using the specified properties.
     * @function create
     * @memberof SphProcessThreadData
     * @static
     * @param {ISphProcessThreadData=} [properties] Properties to set
     * @returns {SphProcessThreadData} SphProcessThreadData instance
     */
    SphProcessThreadData.create = function create(properties) {
        return new SphProcessThreadData(properties);
    };

    /**
     * Encodes the specified SphProcessThreadData message. Does not implicitly {@link SphProcessThreadData.verify|verify} messages.
     * @function encode
     * @memberof SphProcessThreadData
     * @static
     * @param {ISphProcessThreadData} message SphProcessThreadData message or plain object to encode
     * @param {$protobuf.Writer} [writer] Writer to encode to
     * @returns {$protobuf.Writer} Writer
     */
    SphProcessThreadData.encode = function encode(message, writer) {
        if (!writer)
            writer = $Writer.create();
        if (message.cpu != null && Object.hasOwnProperty.call(message, "cpu"))
            writer.uint32(/* id 1, wireType 0 =*/8).int32(message.cpu);
        if (message.dur != null && Object.hasOwnProperty.call(message, "dur"))
            writer.uint32(/* id 2, wireType 0 =*/16).int64(message.dur);
        if (message.id != null && Object.hasOwnProperty.call(message, "id"))
            writer.uint32(/* id 3, wireType 0 =*/24).int64(message.id);
        if (message.tid != null && Object.hasOwnProperty.call(message, "tid"))
            writer.uint32(/* id 4, wireType 0 =*/32).int64(message.tid);
        if (message.state != null && Object.hasOwnProperty.call(message, "state"))
            writer.uint32(/* id 5, wireType 2 =*/42).string(message.state);
        if (message.pid != null && Object.hasOwnProperty.call(message, "pid"))
            writer.uint32(/* id 6, wireType 0 =*/48).int64(message.pid);
        if (message.startTime != null && Object.hasOwnProperty.call(message, "startTime"))
            writer.uint32(/* id 7, wireType 0 =*/56).int64(message.startTime);
        if (message.argSetId != null && Object.hasOwnProperty.call(message, "argSetId"))
            writer.uint32(/* id 8, wireType 0 =*/64).int64(message.argSetId);
        return writer;
    };

    /**
     * Encodes the specified SphProcessThreadData message, length delimited. Does not implicitly {@link SphProcessThreadData.verify|verify} messages.
     * @function encodeDelimited
     * @memberof SphProcessThreadData
     * @static
     * @param {ISphProcessThreadData} message SphProcessThreadData message or plain object to encode
     * @param {$protobuf.Writer} [writer] Writer to encode to
     * @returns {$protobuf.Writer} Writer
     */
    SphProcessThreadData.encodeDelimited = function encodeDelimited(message, writer) {
        return this.encode(message, writer).ldelim();
    };

    /**
     * Decodes a SphProcessThreadData message from the specified reader or buffer.
     * @function decode
     * @memberof SphProcessThreadData
     * @static
     * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
     * @param {number} [length] Message length if known beforehand
     * @returns {SphProcessThreadData} SphProcessThreadData
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    SphProcessThreadData.decode = function decode(reader, length) {
        if (!(reader instanceof $Reader))
            reader = $Reader.create(reader);
        var end = length === undefined ? reader.len : reader.pos + length, message = new $root.SphProcessThreadData();
        while (reader.pos < end) {
            var tag = reader.uint32();
            switch (tag >>> 3) {
            case 1: {
                    message.cpu = reader.int32();
                    break;
                }
            case 2: {
                    message.dur = reader.int64();
                    break;
                }
            case 3: {
                    message.id = reader.int64();
                    break;
                }
            case 4: {
                    message.tid = reader.int64();
                    break;
                }
            case 5: {
                    message.state = reader.string();
                    break;
                }
            case 6: {
                    message.pid = reader.int64();
                    break;
                }
            case 7: {
                    message.startTime = reader.int64();
                    break;
                }
            case 8: {
                    message.argSetId = reader.int64();
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
     * Decodes a SphProcessThreadData message from the specified reader or buffer, length delimited.
     * @function decodeDelimited
     * @memberof SphProcessThreadData
     * @static
     * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
     * @returns {SphProcessThreadData} SphProcessThreadData
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    SphProcessThreadData.decodeDelimited = function decodeDelimited(reader) {
        if (!(reader instanceof $Reader))
            reader = new $Reader(reader);
        return this.decode(reader, reader.uint32());
    };

    /**
     * Verifies a SphProcessThreadData message.
     * @function verify
     * @memberof SphProcessThreadData
     * @static
     * @param {Object.<string,*>} message Plain object to verify
     * @returns {string|null} `null` if valid, otherwise the reason why it is not
     */
    SphProcessThreadData.verify = function verify(message) {
        if (typeof message !== "object" || message === null)
            return "object expected";
        if (message.cpu != null && message.hasOwnProperty("cpu"))
            if (!$util.isInteger(message.cpu))
                return "cpu: integer expected";
        if (message.dur != null && message.hasOwnProperty("dur"))
            if (!$util.isInteger(message.dur) && !(message.dur && $util.isInteger(message.dur.low) && $util.isInteger(message.dur.high)))
                return "dur: integer|Long expected";
        if (message.id != null && message.hasOwnProperty("id"))
            if (!$util.isInteger(message.id) && !(message.id && $util.isInteger(message.id.low) && $util.isInteger(message.id.high)))
                return "id: integer|Long expected";
        if (message.tid != null && message.hasOwnProperty("tid"))
            if (!$util.isInteger(message.tid) && !(message.tid && $util.isInteger(message.tid.low) && $util.isInteger(message.tid.high)))
                return "tid: integer|Long expected";
        if (message.state != null && message.hasOwnProperty("state"))
            if (!$util.isString(message.state))
                return "state: string expected";
        if (message.pid != null && message.hasOwnProperty("pid"))
            if (!$util.isInteger(message.pid) && !(message.pid && $util.isInteger(message.pid.low) && $util.isInteger(message.pid.high)))
                return "pid: integer|Long expected";
        if (message.startTime != null && message.hasOwnProperty("startTime"))
            if (!$util.isInteger(message.startTime) && !(message.startTime && $util.isInteger(message.startTime.low) && $util.isInteger(message.startTime.high)))
                return "startTime: integer|Long expected";
        if (message.argSetId != null && message.hasOwnProperty("argSetId"))
            if (!$util.isInteger(message.argSetId) && !(message.argSetId && $util.isInteger(message.argSetId.low) && $util.isInteger(message.argSetId.high)))
                return "argSetId: integer|Long expected";
        return null;
    };

    /**
     * Creates a SphProcessThreadData message from a plain object. Also converts values to their respective internal types.
     * @function fromObject
     * @memberof SphProcessThreadData
     * @static
     * @param {Object.<string,*>} object Plain object
     * @returns {SphProcessThreadData} SphProcessThreadData
     */
    SphProcessThreadData.fromObject = function fromObject(object) {
        if (object instanceof $root.SphProcessThreadData)
            return object;
        var message = new $root.SphProcessThreadData();
        if (object.cpu != null)
            message.cpu = object.cpu | 0;
        if (object.dur != null)
            if ($util.Long)
                (message.dur = $util.Long.fromValue(object.dur)).unsigned = false;
            else if (typeof object.dur === "string")
                message.dur = parseInt(object.dur, 10);
            else if (typeof object.dur === "number")
                message.dur = object.dur;
            else if (typeof object.dur === "object")
                message.dur = new $util.LongBits(object.dur.low >>> 0, object.dur.high >>> 0).toNumber();
        if (object.id != null)
            if ($util.Long)
                (message.id = $util.Long.fromValue(object.id)).unsigned = false;
            else if (typeof object.id === "string")
                message.id = parseInt(object.id, 10);
            else if (typeof object.id === "number")
                message.id = object.id;
            else if (typeof object.id === "object")
                message.id = new $util.LongBits(object.id.low >>> 0, object.id.high >>> 0).toNumber();
        if (object.tid != null)
            if ($util.Long)
                (message.tid = $util.Long.fromValue(object.tid)).unsigned = false;
            else if (typeof object.tid === "string")
                message.tid = parseInt(object.tid, 10);
            else if (typeof object.tid === "number")
                message.tid = object.tid;
            else if (typeof object.tid === "object")
                message.tid = new $util.LongBits(object.tid.low >>> 0, object.tid.high >>> 0).toNumber();
        if (object.state != null)
            message.state = String(object.state);
        if (object.pid != null)
            if ($util.Long)
                (message.pid = $util.Long.fromValue(object.pid)).unsigned = false;
            else if (typeof object.pid === "string")
                message.pid = parseInt(object.pid, 10);
            else if (typeof object.pid === "number")
                message.pid = object.pid;
            else if (typeof object.pid === "object")
                message.pid = new $util.LongBits(object.pid.low >>> 0, object.pid.high >>> 0).toNumber();
        if (object.startTime != null)
            if ($util.Long)
                (message.startTime = $util.Long.fromValue(object.startTime)).unsigned = false;
            else if (typeof object.startTime === "string")
                message.startTime = parseInt(object.startTime, 10);
            else if (typeof object.startTime === "number")
                message.startTime = object.startTime;
            else if (typeof object.startTime === "object")
                message.startTime = new $util.LongBits(object.startTime.low >>> 0, object.startTime.high >>> 0).toNumber();
        if (object.argSetId != null)
            if ($util.Long)
                (message.argSetId = $util.Long.fromValue(object.argSetId)).unsigned = false;
            else if (typeof object.argSetId === "string")
                message.argSetId = parseInt(object.argSetId, 10);
            else if (typeof object.argSetId === "number")
                message.argSetId = object.argSetId;
            else if (typeof object.argSetId === "object")
                message.argSetId = new $util.LongBits(object.argSetId.low >>> 0, object.argSetId.high >>> 0).toNumber();
        return message;
    };

    /**
     * Creates a plain object from a SphProcessThreadData message. Also converts values to other types if specified.
     * @function toObject
     * @memberof SphProcessThreadData
     * @static
     * @param {SphProcessThreadData} message SphProcessThreadData
     * @param {$protobuf.IConversionOptions} [options] Conversion options
     * @returns {Object.<string,*>} Plain object
     */
    SphProcessThreadData.toObject = function toObject(message, options) {
        if (!options)
            options = {};
        var object = {};
        if (options.defaults) {
            object.cpu = 0;
            if ($util.Long) {
                var long = new $util.Long(0, 0, false);
                object.dur = options.longs === String ? long.toString() : options.longs === Number ? long.toNumber() : long;
            } else
                object.dur = options.longs === String ? "0" : 0;
            if ($util.Long) {
                var long = new $util.Long(0, 0, false);
                object.id = options.longs === String ? long.toString() : options.longs === Number ? long.toNumber() : long;
            } else
                object.id = options.longs === String ? "0" : 0;
            if ($util.Long) {
                var long = new $util.Long(0, 0, false);
                object.tid = options.longs === String ? long.toString() : options.longs === Number ? long.toNumber() : long;
            } else
                object.tid = options.longs === String ? "0" : 0;
            object.state = "";
            if ($util.Long) {
                var long = new $util.Long(0, 0, false);
                object.pid = options.longs === String ? long.toString() : options.longs === Number ? long.toNumber() : long;
            } else
                object.pid = options.longs === String ? "0" : 0;
            if ($util.Long) {
                var long = new $util.Long(0, 0, false);
                object.startTime = options.longs === String ? long.toString() : options.longs === Number ? long.toNumber() : long;
            } else
                object.startTime = options.longs === String ? "0" : 0;
            if ($util.Long) {
                var long = new $util.Long(0, 0, false);
                object.argSetId = options.longs === String ? long.toString() : options.longs === Number ? long.toNumber() : long;
            } else
                object.argSetId = options.longs === String ? "0" : 0;
        }
        if (message.cpu != null && message.hasOwnProperty("cpu"))
            object.cpu = message.cpu;
        if (message.dur != null && message.hasOwnProperty("dur"))
            if (typeof message.dur === "number")
                object.dur = options.longs === String ? String(message.dur) : message.dur;
            else
                object.dur = options.longs === String ? $util.Long.prototype.toString.call(message.dur) : options.longs === Number ? new $util.LongBits(message.dur.low >>> 0, message.dur.high >>> 0).toNumber() : message.dur;
        if (message.id != null && message.hasOwnProperty("id"))
            if (typeof message.id === "number")
                object.id = options.longs === String ? String(message.id) : message.id;
            else
                object.id = options.longs === String ? $util.Long.prototype.toString.call(message.id) : options.longs === Number ? new $util.LongBits(message.id.low >>> 0, message.id.high >>> 0).toNumber() : message.id;
        if (message.tid != null && message.hasOwnProperty("tid"))
            if (typeof message.tid === "number")
                object.tid = options.longs === String ? String(message.tid) : message.tid;
            else
                object.tid = options.longs === String ? $util.Long.prototype.toString.call(message.tid) : options.longs === Number ? new $util.LongBits(message.tid.low >>> 0, message.tid.high >>> 0).toNumber() : message.tid;
        if (message.state != null && message.hasOwnProperty("state"))
            object.state = message.state;
        if (message.pid != null && message.hasOwnProperty("pid"))
            if (typeof message.pid === "number")
                object.pid = options.longs === String ? String(message.pid) : message.pid;
            else
                object.pid = options.longs === String ? $util.Long.prototype.toString.call(message.pid) : options.longs === Number ? new $util.LongBits(message.pid.low >>> 0, message.pid.high >>> 0).toNumber() : message.pid;
        if (message.startTime != null && message.hasOwnProperty("startTime"))
            if (typeof message.startTime === "number")
                object.startTime = options.longs === String ? String(message.startTime) : message.startTime;
            else
                object.startTime = options.longs === String ? $util.Long.prototype.toString.call(message.startTime) : options.longs === Number ? new $util.LongBits(message.startTime.low >>> 0, message.startTime.high >>> 0).toNumber() : message.startTime;
        if (message.argSetId != null && message.hasOwnProperty("argSetId"))
            if (typeof message.argSetId === "number")
                object.argSetId = options.longs === String ? String(message.argSetId) : message.argSetId;
            else
                object.argSetId = options.longs === String ? $util.Long.prototype.toString.call(message.argSetId) : options.longs === Number ? new $util.LongBits(message.argSetId.low >>> 0, message.argSetId.high >>> 0).toNumber() : message.argSetId;
        return object;
    };

    /**
     * Converts this SphProcessThreadData to JSON.
     * @function toJSON
     * @memberof SphProcessThreadData
     * @instance
     * @returns {Object.<string,*>} JSON object
     */
    SphProcessThreadData.prototype.toJSON = function toJSON() {
        return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
    };

    /**
     * Gets the default type url for SphProcessThreadData
     * @function getTypeUrl
     * @memberof SphProcessThreadData
     * @static
     * @param {string} [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
     * @returns {string} The default type url
     */
    SphProcessThreadData.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
        if (typeUrlPrefix === undefined) {
            typeUrlPrefix = "type.googleapis.com";
        }
        return typeUrlPrefix + "/SphProcessThreadData";
    };

    return SphProcessThreadData;
})();

$root.SphProcessFuncData = (function() {

    /**
     * Properties of a SphProcessFuncData.
     * @exports ISphProcessFuncData
     * @interface ISphProcessFuncData
     * @property {number|Long|null} [startTs] SphProcessFuncData startTs
     * @property {number|Long|null} [dur] SphProcessFuncData dur
     * @property {number|Long|null} [argsetid] SphProcessFuncData argsetid
     * @property {number|null} [depth] SphProcessFuncData depth
     * @property {number|Long|null} [id] SphProcessFuncData id
     * @property {number|null} [itid] SphProcessFuncData itid
     * @property {number|null} [ipid] SphProcessFuncData ipid
     */

    /**
     * Constructs a new SphProcessFuncData.
     * @exports SphProcessFuncData
     * @classdesc Represents a SphProcessFuncData.
     * @implements ISphProcessFuncData
     * @constructor
     * @param {ISphProcessFuncData=} [properties] Properties to set
     */
    function SphProcessFuncData(properties) {
        if (properties)
            for (var keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                if (properties[keys[i]] != null)
                    this[keys[i]] = properties[keys[i]];
    }

    /**
     * SphProcessFuncData startTs.
     * @member {number|Long} startTs
     * @memberof SphProcessFuncData
     * @instance
     */
    SphProcessFuncData.prototype.startTs = $util.Long ? $util.Long.fromBits(0,0,false) : 0;

    /**
     * SphProcessFuncData dur.
     * @member {number|Long} dur
     * @memberof SphProcessFuncData
     * @instance
     */
    SphProcessFuncData.prototype.dur = $util.Long ? $util.Long.fromBits(0,0,false) : 0;

    /**
     * SphProcessFuncData argsetid.
     * @member {number|Long} argsetid
     * @memberof SphProcessFuncData
     * @instance
     */
    SphProcessFuncData.prototype.argsetid = $util.Long ? $util.Long.fromBits(0,0,false) : 0;

    /**
     * SphProcessFuncData depth.
     * @member {number} depth
     * @memberof SphProcessFuncData
     * @instance
     */
    SphProcessFuncData.prototype.depth = 0;

    /**
     * SphProcessFuncData id.
     * @member {number|Long} id
     * @memberof SphProcessFuncData
     * @instance
     */
    SphProcessFuncData.prototype.id = $util.Long ? $util.Long.fromBits(0,0,false) : 0;

    /**
     * SphProcessFuncData itid.
     * @member {number} itid
     * @memberof SphProcessFuncData
     * @instance
     */
    SphProcessFuncData.prototype.itid = 0;

    /**
     * SphProcessFuncData ipid.
     * @member {number} ipid
     * @memberof SphProcessFuncData
     * @instance
     */
    SphProcessFuncData.prototype.ipid = 0;

    /**
     * Creates a new SphProcessFuncData instance using the specified properties.
     * @function create
     * @memberof SphProcessFuncData
     * @static
     * @param {ISphProcessFuncData=} [properties] Properties to set
     * @returns {SphProcessFuncData} SphProcessFuncData instance
     */
    SphProcessFuncData.create = function create(properties) {
        return new SphProcessFuncData(properties);
    };

    /**
     * Encodes the specified SphProcessFuncData message. Does not implicitly {@link SphProcessFuncData.verify|verify} messages.
     * @function encode
     * @memberof SphProcessFuncData
     * @static
     * @param {ISphProcessFuncData} message SphProcessFuncData message or plain object to encode
     * @param {$protobuf.Writer} [writer] Writer to encode to
     * @returns {$protobuf.Writer} Writer
     */
    SphProcessFuncData.encode = function encode(message, writer) {
        if (!writer)
            writer = $Writer.create();
        if (message.startTs != null && Object.hasOwnProperty.call(message, "startTs"))
            writer.uint32(/* id 1, wireType 0 =*/8).int64(message.startTs);
        if (message.dur != null && Object.hasOwnProperty.call(message, "dur"))
            writer.uint32(/* id 2, wireType 0 =*/16).int64(message.dur);
        if (message.argsetid != null && Object.hasOwnProperty.call(message, "argsetid"))
            writer.uint32(/* id 3, wireType 0 =*/24).int64(message.argsetid);
        if (message.depth != null && Object.hasOwnProperty.call(message, "depth"))
            writer.uint32(/* id 4, wireType 0 =*/32).int32(message.depth);
        if (message.id != null && Object.hasOwnProperty.call(message, "id"))
            writer.uint32(/* id 5, wireType 0 =*/40).int64(message.id);
        if (message.itid != null && Object.hasOwnProperty.call(message, "itid"))
            writer.uint32(/* id 6, wireType 0 =*/48).int32(message.itid);
        if (message.ipid != null && Object.hasOwnProperty.call(message, "ipid"))
            writer.uint32(/* id 7, wireType 0 =*/56).int32(message.ipid);
        return writer;
    };

    /**
     * Encodes the specified SphProcessFuncData message, length delimited. Does not implicitly {@link SphProcessFuncData.verify|verify} messages.
     * @function encodeDelimited
     * @memberof SphProcessFuncData
     * @static
     * @param {ISphProcessFuncData} message SphProcessFuncData message or plain object to encode
     * @param {$protobuf.Writer} [writer] Writer to encode to
     * @returns {$protobuf.Writer} Writer
     */
    SphProcessFuncData.encodeDelimited = function encodeDelimited(message, writer) {
        return this.encode(message, writer).ldelim();
    };

    /**
     * Decodes a SphProcessFuncData message from the specified reader or buffer.
     * @function decode
     * @memberof SphProcessFuncData
     * @static
     * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
     * @param {number} [length] Message length if known beforehand
     * @returns {SphProcessFuncData} SphProcessFuncData
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    SphProcessFuncData.decode = function decode(reader, length) {
        if (!(reader instanceof $Reader))
            reader = $Reader.create(reader);
        var end = length === undefined ? reader.len : reader.pos + length, message = new $root.SphProcessFuncData();
        while (reader.pos < end) {
            var tag = reader.uint32();
            switch (tag >>> 3) {
            case 1: {
                    message.startTs = reader.int64();
                    break;
                }
            case 2: {
                    message.dur = reader.int64();
                    break;
                }
            case 3: {
                    message.argsetid = reader.int64();
                    break;
                }
            case 4: {
                    message.depth = reader.int32();
                    break;
                }
            case 5: {
                    message.id = reader.int64();
                    break;
                }
            case 6: {
                    message.itid = reader.int32();
                    break;
                }
            case 7: {
                    message.ipid = reader.int32();
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
     * Decodes a SphProcessFuncData message from the specified reader or buffer, length delimited.
     * @function decodeDelimited
     * @memberof SphProcessFuncData
     * @static
     * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
     * @returns {SphProcessFuncData} SphProcessFuncData
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    SphProcessFuncData.decodeDelimited = function decodeDelimited(reader) {
        if (!(reader instanceof $Reader))
            reader = new $Reader(reader);
        return this.decode(reader, reader.uint32());
    };

    /**
     * Verifies a SphProcessFuncData message.
     * @function verify
     * @memberof SphProcessFuncData
     * @static
     * @param {Object.<string,*>} message Plain object to verify
     * @returns {string|null} `null` if valid, otherwise the reason why it is not
     */
    SphProcessFuncData.verify = function verify(message) {
        if (typeof message !== "object" || message === null)
            return "object expected";
        if (message.startTs != null && message.hasOwnProperty("startTs"))
            if (!$util.isInteger(message.startTs) && !(message.startTs && $util.isInteger(message.startTs.low) && $util.isInteger(message.startTs.high)))
                return "startTs: integer|Long expected";
        if (message.dur != null && message.hasOwnProperty("dur"))
            if (!$util.isInteger(message.dur) && !(message.dur && $util.isInteger(message.dur.low) && $util.isInteger(message.dur.high)))
                return "dur: integer|Long expected";
        if (message.argsetid != null && message.hasOwnProperty("argsetid"))
            if (!$util.isInteger(message.argsetid) && !(message.argsetid && $util.isInteger(message.argsetid.low) && $util.isInteger(message.argsetid.high)))
                return "argsetid: integer|Long expected";
        if (message.depth != null && message.hasOwnProperty("depth"))
            if (!$util.isInteger(message.depth))
                return "depth: integer expected";
        if (message.id != null && message.hasOwnProperty("id"))
            if (!$util.isInteger(message.id) && !(message.id && $util.isInteger(message.id.low) && $util.isInteger(message.id.high)))
                return "id: integer|Long expected";
        if (message.itid != null && message.hasOwnProperty("itid"))
            if (!$util.isInteger(message.itid))
                return "itid: integer expected";
        if (message.ipid != null && message.hasOwnProperty("ipid"))
            if (!$util.isInteger(message.ipid))
                return "ipid: integer expected";
        return null;
    };

    /**
     * Creates a SphProcessFuncData message from a plain object. Also converts values to their respective internal types.
     * @function fromObject
     * @memberof SphProcessFuncData
     * @static
     * @param {Object.<string,*>} object Plain object
     * @returns {SphProcessFuncData} SphProcessFuncData
     */
    SphProcessFuncData.fromObject = function fromObject(object) {
        if (object instanceof $root.SphProcessFuncData)
            return object;
        var message = new $root.SphProcessFuncData();
        if (object.startTs != null)
            if ($util.Long)
                (message.startTs = $util.Long.fromValue(object.startTs)).unsigned = false;
            else if (typeof object.startTs === "string")
                message.startTs = parseInt(object.startTs, 10);
            else if (typeof object.startTs === "number")
                message.startTs = object.startTs;
            else if (typeof object.startTs === "object")
                message.startTs = new $util.LongBits(object.startTs.low >>> 0, object.startTs.high >>> 0).toNumber();
        if (object.dur != null)
            if ($util.Long)
                (message.dur = $util.Long.fromValue(object.dur)).unsigned = false;
            else if (typeof object.dur === "string")
                message.dur = parseInt(object.dur, 10);
            else if (typeof object.dur === "number")
                message.dur = object.dur;
            else if (typeof object.dur === "object")
                message.dur = new $util.LongBits(object.dur.low >>> 0, object.dur.high >>> 0).toNumber();
        if (object.argsetid != null)
            if ($util.Long)
                (message.argsetid = $util.Long.fromValue(object.argsetid)).unsigned = false;
            else if (typeof object.argsetid === "string")
                message.argsetid = parseInt(object.argsetid, 10);
            else if (typeof object.argsetid === "number")
                message.argsetid = object.argsetid;
            else if (typeof object.argsetid === "object")
                message.argsetid = new $util.LongBits(object.argsetid.low >>> 0, object.argsetid.high >>> 0).toNumber();
        if (object.depth != null)
            message.depth = object.depth | 0;
        if (object.id != null)
            if ($util.Long)
                (message.id = $util.Long.fromValue(object.id)).unsigned = false;
            else if (typeof object.id === "string")
                message.id = parseInt(object.id, 10);
            else if (typeof object.id === "number")
                message.id = object.id;
            else if (typeof object.id === "object")
                message.id = new $util.LongBits(object.id.low >>> 0, object.id.high >>> 0).toNumber();
        if (object.itid != null)
            message.itid = object.itid | 0;
        if (object.ipid != null)
            message.ipid = object.ipid | 0;
        return message;
    };

    /**
     * Creates a plain object from a SphProcessFuncData message. Also converts values to other types if specified.
     * @function toObject
     * @memberof SphProcessFuncData
     * @static
     * @param {SphProcessFuncData} message SphProcessFuncData
     * @param {$protobuf.IConversionOptions} [options] Conversion options
     * @returns {Object.<string,*>} Plain object
     */
    SphProcessFuncData.toObject = function toObject(message, options) {
        if (!options)
            options = {};
        var object = {};
        if (options.defaults) {
            if ($util.Long) {
                var long = new $util.Long(0, 0, false);
                object.startTs = options.longs === String ? long.toString() : options.longs === Number ? long.toNumber() : long;
            } else
                object.startTs = options.longs === String ? "0" : 0;
            if ($util.Long) {
                var long = new $util.Long(0, 0, false);
                object.dur = options.longs === String ? long.toString() : options.longs === Number ? long.toNumber() : long;
            } else
                object.dur = options.longs === String ? "0" : 0;
            if ($util.Long) {
                var long = new $util.Long(0, 0, false);
                object.argsetid = options.longs === String ? long.toString() : options.longs === Number ? long.toNumber() : long;
            } else
                object.argsetid = options.longs === String ? "0" : 0;
            object.depth = 0;
            if ($util.Long) {
                var long = new $util.Long(0, 0, false);
                object.id = options.longs === String ? long.toString() : options.longs === Number ? long.toNumber() : long;
            } else
                object.id = options.longs === String ? "0" : 0;
            object.itid = 0;
            object.ipid = 0;
        }
        if (message.startTs != null && message.hasOwnProperty("startTs"))
            if (typeof message.startTs === "number")
                object.startTs = options.longs === String ? String(message.startTs) : message.startTs;
            else
                object.startTs = options.longs === String ? $util.Long.prototype.toString.call(message.startTs) : options.longs === Number ? new $util.LongBits(message.startTs.low >>> 0, message.startTs.high >>> 0).toNumber() : message.startTs;
        if (message.dur != null && message.hasOwnProperty("dur"))
            if (typeof message.dur === "number")
                object.dur = options.longs === String ? String(message.dur) : message.dur;
            else
                object.dur = options.longs === String ? $util.Long.prototype.toString.call(message.dur) : options.longs === Number ? new $util.LongBits(message.dur.low >>> 0, message.dur.high >>> 0).toNumber() : message.dur;
        if (message.argsetid != null && message.hasOwnProperty("argsetid"))
            if (typeof message.argsetid === "number")
                object.argsetid = options.longs === String ? String(message.argsetid) : message.argsetid;
            else
                object.argsetid = options.longs === String ? $util.Long.prototype.toString.call(message.argsetid) : options.longs === Number ? new $util.LongBits(message.argsetid.low >>> 0, message.argsetid.high >>> 0).toNumber() : message.argsetid;
        if (message.depth != null && message.hasOwnProperty("depth"))
            object.depth = message.depth;
        if (message.id != null && message.hasOwnProperty("id"))
            if (typeof message.id === "number")
                object.id = options.longs === String ? String(message.id) : message.id;
            else
                object.id = options.longs === String ? $util.Long.prototype.toString.call(message.id) : options.longs === Number ? new $util.LongBits(message.id.low >>> 0, message.id.high >>> 0).toNumber() : message.id;
        if (message.itid != null && message.hasOwnProperty("itid"))
            object.itid = message.itid;
        if (message.ipid != null && message.hasOwnProperty("ipid"))
            object.ipid = message.ipid;
        return object;
    };

    /**
     * Converts this SphProcessFuncData to JSON.
     * @function toJSON
     * @memberof SphProcessFuncData
     * @instance
     * @returns {Object.<string,*>} JSON object
     */
    SphProcessFuncData.prototype.toJSON = function toJSON() {
        return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
    };

    /**
     * Gets the default type url for SphProcessFuncData
     * @function getTypeUrl
     * @memberof SphProcessFuncData
     * @static
     * @param {string} [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
     * @returns {string} The default type url
     */
    SphProcessFuncData.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
        if (typeUrlPrefix === undefined) {
            typeUrlPrefix = "type.googleapis.com";
        }
        return typeUrlPrefix + "/SphProcessFuncData";
    };

    return SphProcessFuncData;
})();

$root.SphProcessInputEventData = (function() {

    /**
     * Properties of a SphProcessInputEventData.
     * @exports ISphProcessInputEventData
     * @interface ISphProcessInputEventData
     * @property {number|Long|null} [startTs] SphProcessInputEventData startTs
     * @property {number|Long|null} [dur] SphProcessInputEventData dur
     * @property {number|Long|null} [argsetid] SphProcessInputEventData argsetid
     * @property {number|null} [tid] SphProcessInputEventData tid
     * @property {number|null} [pid] SphProcessInputEventData pid
     * @property {number|null} [isMainThread] SphProcessInputEventData isMainThread
     * @property {number|null} [trackId] SphProcessInputEventData trackId
     * @property {number|null} [parentId] SphProcessInputEventData parentId
     * @property {number|null} [id] SphProcessInputEventData id
     * @property {number|null} [cookie] SphProcessInputEventData cookie
     * @property {number|null} [depth] SphProcessInputEventData depth
     */

    /**
     * Constructs a new SphProcessInputEventData.
     * @exports SphProcessInputEventData
     * @classdesc Represents a SphProcessInputEventData.
     * @implements ISphProcessInputEventData
     * @constructor
     * @param {ISphProcessInputEventData=} [properties] Properties to set
     */
    function SphProcessInputEventData(properties) {
        if (properties)
            for (var keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                if (properties[keys[i]] != null)
                    this[keys[i]] = properties[keys[i]];
    }

    /**
     * SphProcessInputEventData startTs.
     * @member {number|Long} startTs
     * @memberof SphProcessInputEventData
     * @instance
     */
    SphProcessInputEventData.prototype.startTs = $util.Long ? $util.Long.fromBits(0,0,false) : 0;

    /**
     * SphProcessInputEventData dur.
     * @member {number|Long} dur
     * @memberof SphProcessInputEventData
     * @instance
     */
    SphProcessInputEventData.prototype.dur = $util.Long ? $util.Long.fromBits(0,0,false) : 0;

    /**
     * SphProcessInputEventData argsetid.
     * @member {number|Long} argsetid
     * @memberof SphProcessInputEventData
     * @instance
     */
    SphProcessInputEventData.prototype.argsetid = $util.Long ? $util.Long.fromBits(0,0,false) : 0;

    /**
     * SphProcessInputEventData tid.
     * @member {number} tid
     * @memberof SphProcessInputEventData
     * @instance
     */
    SphProcessInputEventData.prototype.tid = 0;

    /**
     * SphProcessInputEventData pid.
     * @member {number} pid
     * @memberof SphProcessInputEventData
     * @instance
     */
    SphProcessInputEventData.prototype.pid = 0;

    /**
     * SphProcessInputEventData isMainThread.
     * @member {number} isMainThread
     * @memberof SphProcessInputEventData
     * @instance
     */
    SphProcessInputEventData.prototype.isMainThread = 0;

    /**
     * SphProcessInputEventData trackId.
     * @member {number} trackId
     * @memberof SphProcessInputEventData
     * @instance
     */
    SphProcessInputEventData.prototype.trackId = 0;

    /**
     * SphProcessInputEventData parentId.
     * @member {number} parentId
     * @memberof SphProcessInputEventData
     * @instance
     */
    SphProcessInputEventData.prototype.parentId = 0;

    /**
     * SphProcessInputEventData id.
     * @member {number} id
     * @memberof SphProcessInputEventData
     * @instance
     */
    SphProcessInputEventData.prototype.id = 0;

    /**
     * SphProcessInputEventData cookie.
     * @member {number} cookie
     * @memberof SphProcessInputEventData
     * @instance
     */
    SphProcessInputEventData.prototype.cookie = 0;

    /**
     * SphProcessInputEventData depth.
     * @member {number} depth
     * @memberof SphProcessInputEventData
     * @instance
     */
    SphProcessInputEventData.prototype.depth = 0;

    /**
     * Creates a new SphProcessInputEventData instance using the specified properties.
     * @function create
     * @memberof SphProcessInputEventData
     * @static
     * @param {ISphProcessInputEventData=} [properties] Properties to set
     * @returns {SphProcessInputEventData} SphProcessInputEventData instance
     */
    SphProcessInputEventData.create = function create(properties) {
        return new SphProcessInputEventData(properties);
    };

    /**
     * Encodes the specified SphProcessInputEventData message. Does not implicitly {@link SphProcessInputEventData.verify|verify} messages.
     * @function encode
     * @memberof SphProcessInputEventData
     * @static
     * @param {ISphProcessInputEventData} message SphProcessInputEventData message or plain object to encode
     * @param {$protobuf.Writer} [writer] Writer to encode to
     * @returns {$protobuf.Writer} Writer
     */
    SphProcessInputEventData.encode = function encode(message, writer) {
        if (!writer)
            writer = $Writer.create();
        if (message.startTs != null && Object.hasOwnProperty.call(message, "startTs"))
            writer.uint32(/* id 1, wireType 0 =*/8).int64(message.startTs);
        if (message.dur != null && Object.hasOwnProperty.call(message, "dur"))
            writer.uint32(/* id 2, wireType 0 =*/16).int64(message.dur);
        if (message.argsetid != null && Object.hasOwnProperty.call(message, "argsetid"))
            writer.uint32(/* id 3, wireType 0 =*/24).int64(message.argsetid);
        if (message.tid != null && Object.hasOwnProperty.call(message, "tid"))
            writer.uint32(/* id 4, wireType 0 =*/32).int32(message.tid);
        if (message.pid != null && Object.hasOwnProperty.call(message, "pid"))
            writer.uint32(/* id 5, wireType 0 =*/40).int32(message.pid);
        if (message.isMainThread != null && Object.hasOwnProperty.call(message, "isMainThread"))
            writer.uint32(/* id 6, wireType 0 =*/48).int32(message.isMainThread);
        if (message.trackId != null && Object.hasOwnProperty.call(message, "trackId"))
            writer.uint32(/* id 7, wireType 0 =*/56).int32(message.trackId);
        if (message.parentId != null && Object.hasOwnProperty.call(message, "parentId"))
            writer.uint32(/* id 8, wireType 0 =*/64).int32(message.parentId);
        if (message.id != null && Object.hasOwnProperty.call(message, "id"))
            writer.uint32(/* id 9, wireType 0 =*/72).int32(message.id);
        if (message.cookie != null && Object.hasOwnProperty.call(message, "cookie"))
            writer.uint32(/* id 10, wireType 0 =*/80).int32(message.cookie);
        if (message.depth != null && Object.hasOwnProperty.call(message, "depth"))
            writer.uint32(/* id 11, wireType 0 =*/88).int32(message.depth);
        return writer;
    };

    /**
     * Encodes the specified SphProcessInputEventData message, length delimited. Does not implicitly {@link SphProcessInputEventData.verify|verify} messages.
     * @function encodeDelimited
     * @memberof SphProcessInputEventData
     * @static
     * @param {ISphProcessInputEventData} message SphProcessInputEventData message or plain object to encode
     * @param {$protobuf.Writer} [writer] Writer to encode to
     * @returns {$protobuf.Writer} Writer
     */
    SphProcessInputEventData.encodeDelimited = function encodeDelimited(message, writer) {
        return this.encode(message, writer).ldelim();
    };

    /**
     * Decodes a SphProcessInputEventData message from the specified reader or buffer.
     * @function decode
     * @memberof SphProcessInputEventData
     * @static
     * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
     * @param {number} [length] Message length if known beforehand
     * @returns {SphProcessInputEventData} SphProcessInputEventData
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    SphProcessInputEventData.decode = function decode(reader, length) {
        if (!(reader instanceof $Reader))
            reader = $Reader.create(reader);
        var end = length === undefined ? reader.len : reader.pos + length, message = new $root.SphProcessInputEventData();
        while (reader.pos < end) {
            var tag = reader.uint32();
            switch (tag >>> 3) {
            case 1: {
                    message.startTs = reader.int64();
                    break;
                }
            case 2: {
                    message.dur = reader.int64();
                    break;
                }
            case 3: {
                    message.argsetid = reader.int64();
                    break;
                }
            case 4: {
                    message.tid = reader.int32();
                    break;
                }
            case 5: {
                    message.pid = reader.int32();
                    break;
                }
            case 6: {
                    message.isMainThread = reader.int32();
                    break;
                }
            case 7: {
                    message.trackId = reader.int32();
                    break;
                }
            case 8: {
                    message.parentId = reader.int32();
                    break;
                }
            case 9: {
                    message.id = reader.int32();
                    break;
                }
            case 10: {
                    message.cookie = reader.int32();
                    break;
                }
            case 11: {
                    message.depth = reader.int32();
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
     * Decodes a SphProcessInputEventData message from the specified reader or buffer, length delimited.
     * @function decodeDelimited
     * @memberof SphProcessInputEventData
     * @static
     * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
     * @returns {SphProcessInputEventData} SphProcessInputEventData
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    SphProcessInputEventData.decodeDelimited = function decodeDelimited(reader) {
        if (!(reader instanceof $Reader))
            reader = new $Reader(reader);
        return this.decode(reader, reader.uint32());
    };

    /**
     * Verifies a SphProcessInputEventData message.
     * @function verify
     * @memberof SphProcessInputEventData
     * @static
     * @param {Object.<string,*>} message Plain object to verify
     * @returns {string|null} `null` if valid, otherwise the reason why it is not
     */
    SphProcessInputEventData.verify = function verify(message) {
        if (typeof message !== "object" || message === null)
            return "object expected";
        if (message.startTs != null && message.hasOwnProperty("startTs"))
            if (!$util.isInteger(message.startTs) && !(message.startTs && $util.isInteger(message.startTs.low) && $util.isInteger(message.startTs.high)))
                return "startTs: integer|Long expected";
        if (message.dur != null && message.hasOwnProperty("dur"))
            if (!$util.isInteger(message.dur) && !(message.dur && $util.isInteger(message.dur.low) && $util.isInteger(message.dur.high)))
                return "dur: integer|Long expected";
        if (message.argsetid != null && message.hasOwnProperty("argsetid"))
            if (!$util.isInteger(message.argsetid) && !(message.argsetid && $util.isInteger(message.argsetid.low) && $util.isInteger(message.argsetid.high)))
                return "argsetid: integer|Long expected";
        if (message.tid != null && message.hasOwnProperty("tid"))
            if (!$util.isInteger(message.tid))
                return "tid: integer expected";
        if (message.pid != null && message.hasOwnProperty("pid"))
            if (!$util.isInteger(message.pid))
                return "pid: integer expected";
        if (message.isMainThread != null && message.hasOwnProperty("isMainThread"))
            if (!$util.isInteger(message.isMainThread))
                return "isMainThread: integer expected";
        if (message.trackId != null && message.hasOwnProperty("trackId"))
            if (!$util.isInteger(message.trackId))
                return "trackId: integer expected";
        if (message.parentId != null && message.hasOwnProperty("parentId"))
            if (!$util.isInteger(message.parentId))
                return "parentId: integer expected";
        if (message.id != null && message.hasOwnProperty("id"))
            if (!$util.isInteger(message.id))
                return "id: integer expected";
        if (message.cookie != null && message.hasOwnProperty("cookie"))
            if (!$util.isInteger(message.cookie))
                return "cookie: integer expected";
        if (message.depth != null && message.hasOwnProperty("depth"))
            if (!$util.isInteger(message.depth))
                return "depth: integer expected";
        return null;
    };

    /**
     * Creates a SphProcessInputEventData message from a plain object. Also converts values to their respective internal types.
     * @function fromObject
     * @memberof SphProcessInputEventData
     * @static
     * @param {Object.<string,*>} object Plain object
     * @returns {SphProcessInputEventData} SphProcessInputEventData
     */
    SphProcessInputEventData.fromObject = function fromObject(object) {
        if (object instanceof $root.SphProcessInputEventData)
            return object;
        var message = new $root.SphProcessInputEventData();
        if (object.startTs != null)
            if ($util.Long)
                (message.startTs = $util.Long.fromValue(object.startTs)).unsigned = false;
            else if (typeof object.startTs === "string")
                message.startTs = parseInt(object.startTs, 10);
            else if (typeof object.startTs === "number")
                message.startTs = object.startTs;
            else if (typeof object.startTs === "object")
                message.startTs = new $util.LongBits(object.startTs.low >>> 0, object.startTs.high >>> 0).toNumber();
        if (object.dur != null)
            if ($util.Long)
                (message.dur = $util.Long.fromValue(object.dur)).unsigned = false;
            else if (typeof object.dur === "string")
                message.dur = parseInt(object.dur, 10);
            else if (typeof object.dur === "number")
                message.dur = object.dur;
            else if (typeof object.dur === "object")
                message.dur = new $util.LongBits(object.dur.low >>> 0, object.dur.high >>> 0).toNumber();
        if (object.argsetid != null)
            if ($util.Long)
                (message.argsetid = $util.Long.fromValue(object.argsetid)).unsigned = false;
            else if (typeof object.argsetid === "string")
                message.argsetid = parseInt(object.argsetid, 10);
            else if (typeof object.argsetid === "number")
                message.argsetid = object.argsetid;
            else if (typeof object.argsetid === "object")
                message.argsetid = new $util.LongBits(object.argsetid.low >>> 0, object.argsetid.high >>> 0).toNumber();
        if (object.tid != null)
            message.tid = object.tid | 0;
        if (object.pid != null)
            message.pid = object.pid | 0;
        if (object.isMainThread != null)
            message.isMainThread = object.isMainThread | 0;
        if (object.trackId != null)
            message.trackId = object.trackId | 0;
        if (object.parentId != null)
            message.parentId = object.parentId | 0;
        if (object.id != null)
            message.id = object.id | 0;
        if (object.cookie != null)
            message.cookie = object.cookie | 0;
        if (object.depth != null)
            message.depth = object.depth | 0;
        return message;
    };

    /**
     * Creates a plain object from a SphProcessInputEventData message. Also converts values to other types if specified.
     * @function toObject
     * @memberof SphProcessInputEventData
     * @static
     * @param {SphProcessInputEventData} message SphProcessInputEventData
     * @param {$protobuf.IConversionOptions} [options] Conversion options
     * @returns {Object.<string,*>} Plain object
     */
    SphProcessInputEventData.toObject = function toObject(message, options) {
        if (!options)
            options = {};
        var object = {};
        if (options.defaults) {
            if ($util.Long) {
                var long = new $util.Long(0, 0, false);
                object.startTs = options.longs === String ? long.toString() : options.longs === Number ? long.toNumber() : long;
            } else
                object.startTs = options.longs === String ? "0" : 0;
            if ($util.Long) {
                var long = new $util.Long(0, 0, false);
                object.dur = options.longs === String ? long.toString() : options.longs === Number ? long.toNumber() : long;
            } else
                object.dur = options.longs === String ? "0" : 0;
            if ($util.Long) {
                var long = new $util.Long(0, 0, false);
                object.argsetid = options.longs === String ? long.toString() : options.longs === Number ? long.toNumber() : long;
            } else
                object.argsetid = options.longs === String ? "0" : 0;
            object.tid = 0;
            object.pid = 0;
            object.isMainThread = 0;
            object.trackId = 0;
            object.parentId = 0;
            object.id = 0;
            object.cookie = 0;
            object.depth = 0;
        }
        if (message.startTs != null && message.hasOwnProperty("startTs"))
            if (typeof message.startTs === "number")
                object.startTs = options.longs === String ? String(message.startTs) : message.startTs;
            else
                object.startTs = options.longs === String ? $util.Long.prototype.toString.call(message.startTs) : options.longs === Number ? new $util.LongBits(message.startTs.low >>> 0, message.startTs.high >>> 0).toNumber() : message.startTs;
        if (message.dur != null && message.hasOwnProperty("dur"))
            if (typeof message.dur === "number")
                object.dur = options.longs === String ? String(message.dur) : message.dur;
            else
                object.dur = options.longs === String ? $util.Long.prototype.toString.call(message.dur) : options.longs === Number ? new $util.LongBits(message.dur.low >>> 0, message.dur.high >>> 0).toNumber() : message.dur;
        if (message.argsetid != null && message.hasOwnProperty("argsetid"))
            if (typeof message.argsetid === "number")
                object.argsetid = options.longs === String ? String(message.argsetid) : message.argsetid;
            else
                object.argsetid = options.longs === String ? $util.Long.prototype.toString.call(message.argsetid) : options.longs === Number ? new $util.LongBits(message.argsetid.low >>> 0, message.argsetid.high >>> 0).toNumber() : message.argsetid;
        if (message.tid != null && message.hasOwnProperty("tid"))
            object.tid = message.tid;
        if (message.pid != null && message.hasOwnProperty("pid"))
            object.pid = message.pid;
        if (message.isMainThread != null && message.hasOwnProperty("isMainThread"))
            object.isMainThread = message.isMainThread;
        if (message.trackId != null && message.hasOwnProperty("trackId"))
            object.trackId = message.trackId;
        if (message.parentId != null && message.hasOwnProperty("parentId"))
            object.parentId = message.parentId;
        if (message.id != null && message.hasOwnProperty("id"))
            object.id = message.id;
        if (message.cookie != null && message.hasOwnProperty("cookie"))
            object.cookie = message.cookie;
        if (message.depth != null && message.hasOwnProperty("depth"))
            object.depth = message.depth;
        return object;
    };

    /**
     * Converts this SphProcessInputEventData to JSON.
     * @function toJSON
     * @memberof SphProcessInputEventData
     * @instance
     * @returns {Object.<string,*>} JSON object
     */
    SphProcessInputEventData.prototype.toJSON = function toJSON() {
        return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
    };

    /**
     * Gets the default type url for SphProcessInputEventData
     * @function getTypeUrl
     * @memberof SphProcessInputEventData
     * @static
     * @param {string} [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
     * @returns {string} The default type url
     */
    SphProcessInputEventData.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
        if (typeUrlPrefix === undefined) {
            typeUrlPrefix = "type.googleapis.com";
        }
        return typeUrlPrefix + "/SphProcessInputEventData";
    };

    return SphProcessInputEventData;
})();

$root.SphProcessJanksFramesData = (function() {

    /**
     * Properties of a SphProcessJanksFramesData.
     * @exports ISphProcessJanksFramesData
     * @interface ISphProcessJanksFramesData
     * @property {number|Long|null} [ts] SphProcessJanksFramesData ts
     * @property {number|Long|null} [dur] SphProcessJanksFramesData dur
     * @property {number|null} [pid] SphProcessJanksFramesData pid
     * @property {number|null} [id] SphProcessJanksFramesData id
     * @property {number|null} [name] SphProcessJanksFramesData name
     * @property {number|null} [type] SphProcessJanksFramesData type
     * @property {number|null} [depth] SphProcessJanksFramesData depth
     */

    /**
     * Constructs a new SphProcessJanksFramesData.
     * @exports SphProcessJanksFramesData
     * @classdesc Represents a SphProcessJanksFramesData.
     * @implements ISphProcessJanksFramesData
     * @constructor
     * @param {ISphProcessJanksFramesData=} [properties] Properties to set
     */
    function SphProcessJanksFramesData(properties) {
        if (properties)
            for (var keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                if (properties[keys[i]] != null)
                    this[keys[i]] = properties[keys[i]];
    }

    /**
     * SphProcessJanksFramesData ts.
     * @member {number|Long} ts
     * @memberof SphProcessJanksFramesData
     * @instance
     */
    SphProcessJanksFramesData.prototype.ts = $util.Long ? $util.Long.fromBits(0,0,false) : 0;

    /**
     * SphProcessJanksFramesData dur.
     * @member {number|Long} dur
     * @memberof SphProcessJanksFramesData
     * @instance
     */
    SphProcessJanksFramesData.prototype.dur = $util.Long ? $util.Long.fromBits(0,0,false) : 0;

    /**
     * SphProcessJanksFramesData pid.
     * @member {number} pid
     * @memberof SphProcessJanksFramesData
     * @instance
     */
    SphProcessJanksFramesData.prototype.pid = 0;

    /**
     * SphProcessJanksFramesData id.
     * @member {number} id
     * @memberof SphProcessJanksFramesData
     * @instance
     */
    SphProcessJanksFramesData.prototype.id = 0;

    /**
     * SphProcessJanksFramesData name.
     * @member {number} name
     * @memberof SphProcessJanksFramesData
     * @instance
     */
    SphProcessJanksFramesData.prototype.name = 0;

    /**
     * SphProcessJanksFramesData type.
     * @member {number} type
     * @memberof SphProcessJanksFramesData
     * @instance
     */
    SphProcessJanksFramesData.prototype.type = 0;

    /**
     * SphProcessJanksFramesData depth.
     * @member {number} depth
     * @memberof SphProcessJanksFramesData
     * @instance
     */
    SphProcessJanksFramesData.prototype.depth = 0;

    /**
     * Creates a new SphProcessJanksFramesData instance using the specified properties.
     * @function create
     * @memberof SphProcessJanksFramesData
     * @static
     * @param {ISphProcessJanksFramesData=} [properties] Properties to set
     * @returns {SphProcessJanksFramesData} SphProcessJanksFramesData instance
     */
    SphProcessJanksFramesData.create = function create(properties) {
        return new SphProcessJanksFramesData(properties);
    };

    /**
     * Encodes the specified SphProcessJanksFramesData message. Does not implicitly {@link SphProcessJanksFramesData.verify|verify} messages.
     * @function encode
     * @memberof SphProcessJanksFramesData
     * @static
     * @param {ISphProcessJanksFramesData} message SphProcessJanksFramesData message or plain object to encode
     * @param {$protobuf.Writer} [writer] Writer to encode to
     * @returns {$protobuf.Writer} Writer
     */
    SphProcessJanksFramesData.encode = function encode(message, writer) {
        if (!writer)
            writer = $Writer.create();
        if (message.ts != null && Object.hasOwnProperty.call(message, "ts"))
            writer.uint32(/* id 1, wireType 0 =*/8).int64(message.ts);
        if (message.dur != null && Object.hasOwnProperty.call(message, "dur"))
            writer.uint32(/* id 2, wireType 0 =*/16).int64(message.dur);
        if (message.pid != null && Object.hasOwnProperty.call(message, "pid"))
            writer.uint32(/* id 3, wireType 0 =*/24).int32(message.pid);
        if (message.id != null && Object.hasOwnProperty.call(message, "id"))
            writer.uint32(/* id 4, wireType 0 =*/32).int32(message.id);
        if (message.name != null && Object.hasOwnProperty.call(message, "name"))
            writer.uint32(/* id 5, wireType 0 =*/40).int32(message.name);
        if (message.type != null && Object.hasOwnProperty.call(message, "type"))
            writer.uint32(/* id 6, wireType 0 =*/48).int32(message.type);
        if (message.depth != null && Object.hasOwnProperty.call(message, "depth"))
            writer.uint32(/* id 7, wireType 0 =*/56).int32(message.depth);
        return writer;
    };

    /**
     * Encodes the specified SphProcessJanksFramesData message, length delimited. Does not implicitly {@link SphProcessJanksFramesData.verify|verify} messages.
     * @function encodeDelimited
     * @memberof SphProcessJanksFramesData
     * @static
     * @param {ISphProcessJanksFramesData} message SphProcessJanksFramesData message or plain object to encode
     * @param {$protobuf.Writer} [writer] Writer to encode to
     * @returns {$protobuf.Writer} Writer
     */
    SphProcessJanksFramesData.encodeDelimited = function encodeDelimited(message, writer) {
        return this.encode(message, writer).ldelim();
    };

    /**
     * Decodes a SphProcessJanksFramesData message from the specified reader or buffer.
     * @function decode
     * @memberof SphProcessJanksFramesData
     * @static
     * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
     * @param {number} [length] Message length if known beforehand
     * @returns {SphProcessJanksFramesData} SphProcessJanksFramesData
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    SphProcessJanksFramesData.decode = function decode(reader, length) {
        if (!(reader instanceof $Reader))
            reader = $Reader.create(reader);
        var end = length === undefined ? reader.len : reader.pos + length, message = new $root.SphProcessJanksFramesData();
        while (reader.pos < end) {
            var tag = reader.uint32();
            switch (tag >>> 3) {
            case 1: {
                    message.ts = reader.int64();
                    break;
                }
            case 2: {
                    message.dur = reader.int64();
                    break;
                }
            case 3: {
                    message.pid = reader.int32();
                    break;
                }
            case 4: {
                    message.id = reader.int32();
                    break;
                }
            case 5: {
                    message.name = reader.int32();
                    break;
                }
            case 6: {
                    message.type = reader.int32();
                    break;
                }
            case 7: {
                    message.depth = reader.int32();
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
     * Decodes a SphProcessJanksFramesData message from the specified reader or buffer, length delimited.
     * @function decodeDelimited
     * @memberof SphProcessJanksFramesData
     * @static
     * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
     * @returns {SphProcessJanksFramesData} SphProcessJanksFramesData
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    SphProcessJanksFramesData.decodeDelimited = function decodeDelimited(reader) {
        if (!(reader instanceof $Reader))
            reader = new $Reader(reader);
        return this.decode(reader, reader.uint32());
    };

    /**
     * Verifies a SphProcessJanksFramesData message.
     * @function verify
     * @memberof SphProcessJanksFramesData
     * @static
     * @param {Object.<string,*>} message Plain object to verify
     * @returns {string|null} `null` if valid, otherwise the reason why it is not
     */
    SphProcessJanksFramesData.verify = function verify(message) {
        if (typeof message !== "object" || message === null)
            return "object expected";
        if (message.ts != null && message.hasOwnProperty("ts"))
            if (!$util.isInteger(message.ts) && !(message.ts && $util.isInteger(message.ts.low) && $util.isInteger(message.ts.high)))
                return "ts: integer|Long expected";
        if (message.dur != null && message.hasOwnProperty("dur"))
            if (!$util.isInteger(message.dur) && !(message.dur && $util.isInteger(message.dur.low) && $util.isInteger(message.dur.high)))
                return "dur: integer|Long expected";
        if (message.pid != null && message.hasOwnProperty("pid"))
            if (!$util.isInteger(message.pid))
                return "pid: integer expected";
        if (message.id != null && message.hasOwnProperty("id"))
            if (!$util.isInteger(message.id))
                return "id: integer expected";
        if (message.name != null && message.hasOwnProperty("name"))
            if (!$util.isInteger(message.name))
                return "name: integer expected";
        if (message.type != null && message.hasOwnProperty("type"))
            if (!$util.isInteger(message.type))
                return "type: integer expected";
        if (message.depth != null && message.hasOwnProperty("depth"))
            if (!$util.isInteger(message.depth))
                return "depth: integer expected";
        return null;
    };

    /**
     * Creates a SphProcessJanksFramesData message from a plain object. Also converts values to their respective internal types.
     * @function fromObject
     * @memberof SphProcessJanksFramesData
     * @static
     * @param {Object.<string,*>} object Plain object
     * @returns {SphProcessJanksFramesData} SphProcessJanksFramesData
     */
    SphProcessJanksFramesData.fromObject = function fromObject(object) {
        if (object instanceof $root.SphProcessJanksFramesData)
            return object;
        var message = new $root.SphProcessJanksFramesData();
        if (object.ts != null)
            if ($util.Long)
                (message.ts = $util.Long.fromValue(object.ts)).unsigned = false;
            else if (typeof object.ts === "string")
                message.ts = parseInt(object.ts, 10);
            else if (typeof object.ts === "number")
                message.ts = object.ts;
            else if (typeof object.ts === "object")
                message.ts = new $util.LongBits(object.ts.low >>> 0, object.ts.high >>> 0).toNumber();
        if (object.dur != null)
            if ($util.Long)
                (message.dur = $util.Long.fromValue(object.dur)).unsigned = false;
            else if (typeof object.dur === "string")
                message.dur = parseInt(object.dur, 10);
            else if (typeof object.dur === "number")
                message.dur = object.dur;
            else if (typeof object.dur === "object")
                message.dur = new $util.LongBits(object.dur.low >>> 0, object.dur.high >>> 0).toNumber();
        if (object.pid != null)
            message.pid = object.pid | 0;
        if (object.id != null)
            message.id = object.id | 0;
        if (object.name != null)
            message.name = object.name | 0;
        if (object.type != null)
            message.type = object.type | 0;
        if (object.depth != null)
            message.depth = object.depth | 0;
        return message;
    };

    /**
     * Creates a plain object from a SphProcessJanksFramesData message. Also converts values to other types if specified.
     * @function toObject
     * @memberof SphProcessJanksFramesData
     * @static
     * @param {SphProcessJanksFramesData} message SphProcessJanksFramesData
     * @param {$protobuf.IConversionOptions} [options] Conversion options
     * @returns {Object.<string,*>} Plain object
     */
    SphProcessJanksFramesData.toObject = function toObject(message, options) {
        if (!options)
            options = {};
        var object = {};
        if (options.defaults) {
            if ($util.Long) {
                var long = new $util.Long(0, 0, false);
                object.ts = options.longs === String ? long.toString() : options.longs === Number ? long.toNumber() : long;
            } else
                object.ts = options.longs === String ? "0" : 0;
            if ($util.Long) {
                var long = new $util.Long(0, 0, false);
                object.dur = options.longs === String ? long.toString() : options.longs === Number ? long.toNumber() : long;
            } else
                object.dur = options.longs === String ? "0" : 0;
            object.pid = 0;
            object.id = 0;
            object.name = 0;
            object.type = 0;
            object.depth = 0;
        }
        if (message.ts != null && message.hasOwnProperty("ts"))
            if (typeof message.ts === "number")
                object.ts = options.longs === String ? String(message.ts) : message.ts;
            else
                object.ts = options.longs === String ? $util.Long.prototype.toString.call(message.ts) : options.longs === Number ? new $util.LongBits(message.ts.low >>> 0, message.ts.high >>> 0).toNumber() : message.ts;
        if (message.dur != null && message.hasOwnProperty("dur"))
            if (typeof message.dur === "number")
                object.dur = options.longs === String ? String(message.dur) : message.dur;
            else
                object.dur = options.longs === String ? $util.Long.prototype.toString.call(message.dur) : options.longs === Number ? new $util.LongBits(message.dur.low >>> 0, message.dur.high >>> 0).toNumber() : message.dur;
        if (message.pid != null && message.hasOwnProperty("pid"))
            object.pid = message.pid;
        if (message.id != null && message.hasOwnProperty("id"))
            object.id = message.id;
        if (message.name != null && message.hasOwnProperty("name"))
            object.name = message.name;
        if (message.type != null && message.hasOwnProperty("type"))
            object.type = message.type;
        if (message.depth != null && message.hasOwnProperty("depth"))
            object.depth = message.depth;
        return object;
    };

    /**
     * Converts this SphProcessJanksFramesData to JSON.
     * @function toJSON
     * @memberof SphProcessJanksFramesData
     * @instance
     * @returns {Object.<string,*>} JSON object
     */
    SphProcessJanksFramesData.prototype.toJSON = function toJSON() {
        return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
    };

    /**
     * Gets the default type url for SphProcessJanksFramesData
     * @function getTypeUrl
     * @memberof SphProcessJanksFramesData
     * @static
     * @param {string} [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
     * @returns {string} The default type url
     */
    SphProcessJanksFramesData.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
        if (typeUrlPrefix === undefined) {
            typeUrlPrefix = "type.googleapis.com";
        }
        return typeUrlPrefix + "/SphProcessJanksFramesData";
    };

    return SphProcessJanksFramesData;
})();

$root.SphProcessJanksActualData = (function() {

    /**
     * Properties of a SphProcessJanksActualData.
     * @exports ISphProcessJanksActualData
     * @interface ISphProcessJanksActualData
     * @property {number|Long|null} [ts] SphProcessJanksActualData ts
     * @property {number|Long|null} [dur] SphProcessJanksActualData dur
     * @property {number|null} [pid] SphProcessJanksActualData pid
     * @property {number|null} [id] SphProcessJanksActualData id
     * @property {number|null} [name] SphProcessJanksActualData name
     * @property {number|null} [type] SphProcessJanksActualData type
     * @property {number|null} [jankTag] SphProcessJanksActualData jankTag
     * @property {number|null} [dstSlice] SphProcessJanksActualData dstSlice
     * @property {number|null} [depth] SphProcessJanksActualData depth
     */

    /**
     * Constructs a new SphProcessJanksActualData.
     * @exports SphProcessJanksActualData
     * @classdesc Represents a SphProcessJanksActualData.
     * @implements ISphProcessJanksActualData
     * @constructor
     * @param {ISphProcessJanksActualData=} [properties] Properties to set
     */
    function SphProcessJanksActualData(properties) {
        if (properties)
            for (var keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                if (properties[keys[i]] != null)
                    this[keys[i]] = properties[keys[i]];
    }

    /**
     * SphProcessJanksActualData ts.
     * @member {number|Long} ts
     * @memberof SphProcessJanksActualData
     * @instance
     */
    SphProcessJanksActualData.prototype.ts = $util.Long ? $util.Long.fromBits(0,0,false) : 0;

    /**
     * SphProcessJanksActualData dur.
     * @member {number|Long} dur
     * @memberof SphProcessJanksActualData
     * @instance
     */
    SphProcessJanksActualData.prototype.dur = $util.Long ? $util.Long.fromBits(0,0,false) : 0;

    /**
     * SphProcessJanksActualData pid.
     * @member {number} pid
     * @memberof SphProcessJanksActualData
     * @instance
     */
    SphProcessJanksActualData.prototype.pid = 0;

    /**
     * SphProcessJanksActualData id.
     * @member {number} id
     * @memberof SphProcessJanksActualData
     * @instance
     */
    SphProcessJanksActualData.prototype.id = 0;

    /**
     * SphProcessJanksActualData name.
     * @member {number} name
     * @memberof SphProcessJanksActualData
     * @instance
     */
    SphProcessJanksActualData.prototype.name = 0;

    /**
     * SphProcessJanksActualData type.
     * @member {number} type
     * @memberof SphProcessJanksActualData
     * @instance
     */
    SphProcessJanksActualData.prototype.type = 0;

    /**
     * SphProcessJanksActualData jankTag.
     * @member {number} jankTag
     * @memberof SphProcessJanksActualData
     * @instance
     */
    SphProcessJanksActualData.prototype.jankTag = 0;

    /**
     * SphProcessJanksActualData dstSlice.
     * @member {number} dstSlice
     * @memberof SphProcessJanksActualData
     * @instance
     */
    SphProcessJanksActualData.prototype.dstSlice = 0;

    /**
     * SphProcessJanksActualData depth.
     * @member {number} depth
     * @memberof SphProcessJanksActualData
     * @instance
     */
    SphProcessJanksActualData.prototype.depth = 0;

    /**
     * Creates a new SphProcessJanksActualData instance using the specified properties.
     * @function create
     * @memberof SphProcessJanksActualData
     * @static
     * @param {ISphProcessJanksActualData=} [properties] Properties to set
     * @returns {SphProcessJanksActualData} SphProcessJanksActualData instance
     */
    SphProcessJanksActualData.create = function create(properties) {
        return new SphProcessJanksActualData(properties);
    };

    /**
     * Encodes the specified SphProcessJanksActualData message. Does not implicitly {@link SphProcessJanksActualData.verify|verify} messages.
     * @function encode
     * @memberof SphProcessJanksActualData
     * @static
     * @param {ISphProcessJanksActualData} message SphProcessJanksActualData message or plain object to encode
     * @param {$protobuf.Writer} [writer] Writer to encode to
     * @returns {$protobuf.Writer} Writer
     */
    SphProcessJanksActualData.encode = function encode(message, writer) {
        if (!writer)
            writer = $Writer.create();
        if (message.ts != null && Object.hasOwnProperty.call(message, "ts"))
            writer.uint32(/* id 1, wireType 0 =*/8).int64(message.ts);
        if (message.dur != null && Object.hasOwnProperty.call(message, "dur"))
            writer.uint32(/* id 2, wireType 0 =*/16).int64(message.dur);
        if (message.pid != null && Object.hasOwnProperty.call(message, "pid"))
            writer.uint32(/* id 3, wireType 0 =*/24).int32(message.pid);
        if (message.id != null && Object.hasOwnProperty.call(message, "id"))
            writer.uint32(/* id 4, wireType 0 =*/32).int32(message.id);
        if (message.name != null && Object.hasOwnProperty.call(message, "name"))
            writer.uint32(/* id 5, wireType 0 =*/40).int32(message.name);
        if (message.type != null && Object.hasOwnProperty.call(message, "type"))
            writer.uint32(/* id 6, wireType 0 =*/48).int32(message.type);
        if (message.jankTag != null && Object.hasOwnProperty.call(message, "jankTag"))
            writer.uint32(/* id 7, wireType 0 =*/56).int32(message.jankTag);
        if (message.dstSlice != null && Object.hasOwnProperty.call(message, "dstSlice"))
            writer.uint32(/* id 8, wireType 0 =*/64).int32(message.dstSlice);
        if (message.depth != null && Object.hasOwnProperty.call(message, "depth"))
            writer.uint32(/* id 9, wireType 0 =*/72).int32(message.depth);
        return writer;
    };

    /**
     * Encodes the specified SphProcessJanksActualData message, length delimited. Does not implicitly {@link SphProcessJanksActualData.verify|verify} messages.
     * @function encodeDelimited
     * @memberof SphProcessJanksActualData
     * @static
     * @param {ISphProcessJanksActualData} message SphProcessJanksActualData message or plain object to encode
     * @param {$protobuf.Writer} [writer] Writer to encode to
     * @returns {$protobuf.Writer} Writer
     */
    SphProcessJanksActualData.encodeDelimited = function encodeDelimited(message, writer) {
        return this.encode(message, writer).ldelim();
    };

    /**
     * Decodes a SphProcessJanksActualData message from the specified reader or buffer.
     * @function decode
     * @memberof SphProcessJanksActualData
     * @static
     * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
     * @param {number} [length] Message length if known beforehand
     * @returns {SphProcessJanksActualData} SphProcessJanksActualData
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    SphProcessJanksActualData.decode = function decode(reader, length) {
        if (!(reader instanceof $Reader))
            reader = $Reader.create(reader);
        var end = length === undefined ? reader.len : reader.pos + length, message = new $root.SphProcessJanksActualData();
        while (reader.pos < end) {
            var tag = reader.uint32();
            switch (tag >>> 3) {
            case 1: {
                    message.ts = reader.int64();
                    break;
                }
            case 2: {
                    message.dur = reader.int64();
                    break;
                }
            case 3: {
                    message.pid = reader.int32();
                    break;
                }
            case 4: {
                    message.id = reader.int32();
                    break;
                }
            case 5: {
                    message.name = reader.int32();
                    break;
                }
            case 6: {
                    message.type = reader.int32();
                    break;
                }
            case 7: {
                    message.jankTag = reader.int32();
                    break;
                }
            case 8: {
                    message.dstSlice = reader.int32();
                    break;
                }
            case 9: {
                    message.depth = reader.int32();
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
     * Decodes a SphProcessJanksActualData message from the specified reader or buffer, length delimited.
     * @function decodeDelimited
     * @memberof SphProcessJanksActualData
     * @static
     * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
     * @returns {SphProcessJanksActualData} SphProcessJanksActualData
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    SphProcessJanksActualData.decodeDelimited = function decodeDelimited(reader) {
        if (!(reader instanceof $Reader))
            reader = new $Reader(reader);
        return this.decode(reader, reader.uint32());
    };

    /**
     * Verifies a SphProcessJanksActualData message.
     * @function verify
     * @memberof SphProcessJanksActualData
     * @static
     * @param {Object.<string,*>} message Plain object to verify
     * @returns {string|null} `null` if valid, otherwise the reason why it is not
     */
    SphProcessJanksActualData.verify = function verify(message) {
        if (typeof message !== "object" || message === null)
            return "object expected";
        if (message.ts != null && message.hasOwnProperty("ts"))
            if (!$util.isInteger(message.ts) && !(message.ts && $util.isInteger(message.ts.low) && $util.isInteger(message.ts.high)))
                return "ts: integer|Long expected";
        if (message.dur != null && message.hasOwnProperty("dur"))
            if (!$util.isInteger(message.dur) && !(message.dur && $util.isInteger(message.dur.low) && $util.isInteger(message.dur.high)))
                return "dur: integer|Long expected";
        if (message.pid != null && message.hasOwnProperty("pid"))
            if (!$util.isInteger(message.pid))
                return "pid: integer expected";
        if (message.id != null && message.hasOwnProperty("id"))
            if (!$util.isInteger(message.id))
                return "id: integer expected";
        if (message.name != null && message.hasOwnProperty("name"))
            if (!$util.isInteger(message.name))
                return "name: integer expected";
        if (message.type != null && message.hasOwnProperty("type"))
            if (!$util.isInteger(message.type))
                return "type: integer expected";
        if (message.jankTag != null && message.hasOwnProperty("jankTag"))
            if (!$util.isInteger(message.jankTag))
                return "jankTag: integer expected";
        if (message.dstSlice != null && message.hasOwnProperty("dstSlice"))
            if (!$util.isInteger(message.dstSlice))
                return "dstSlice: integer expected";
        if (message.depth != null && message.hasOwnProperty("depth"))
            if (!$util.isInteger(message.depth))
                return "depth: integer expected";
        return null;
    };

    /**
     * Creates a SphProcessJanksActualData message from a plain object. Also converts values to their respective internal types.
     * @function fromObject
     * @memberof SphProcessJanksActualData
     * @static
     * @param {Object.<string,*>} object Plain object
     * @returns {SphProcessJanksActualData} SphProcessJanksActualData
     */
    SphProcessJanksActualData.fromObject = function fromObject(object) {
        if (object instanceof $root.SphProcessJanksActualData)
            return object;
        var message = new $root.SphProcessJanksActualData();
        if (object.ts != null)
            if ($util.Long)
                (message.ts = $util.Long.fromValue(object.ts)).unsigned = false;
            else if (typeof object.ts === "string")
                message.ts = parseInt(object.ts, 10);
            else if (typeof object.ts === "number")
                message.ts = object.ts;
            else if (typeof object.ts === "object")
                message.ts = new $util.LongBits(object.ts.low >>> 0, object.ts.high >>> 0).toNumber();
        if (object.dur != null)
            if ($util.Long)
                (message.dur = $util.Long.fromValue(object.dur)).unsigned = false;
            else if (typeof object.dur === "string")
                message.dur = parseInt(object.dur, 10);
            else if (typeof object.dur === "number")
                message.dur = object.dur;
            else if (typeof object.dur === "object")
                message.dur = new $util.LongBits(object.dur.low >>> 0, object.dur.high >>> 0).toNumber();
        if (object.pid != null)
            message.pid = object.pid | 0;
        if (object.id != null)
            message.id = object.id | 0;
        if (object.name != null)
            message.name = object.name | 0;
        if (object.type != null)
            message.type = object.type | 0;
        if (object.jankTag != null)
            message.jankTag = object.jankTag | 0;
        if (object.dstSlice != null)
            message.dstSlice = object.dstSlice | 0;
        if (object.depth != null)
            message.depth = object.depth | 0;
        return message;
    };

    /**
     * Creates a plain object from a SphProcessJanksActualData message. Also converts values to other types if specified.
     * @function toObject
     * @memberof SphProcessJanksActualData
     * @static
     * @param {SphProcessJanksActualData} message SphProcessJanksActualData
     * @param {$protobuf.IConversionOptions} [options] Conversion options
     * @returns {Object.<string,*>} Plain object
     */
    SphProcessJanksActualData.toObject = function toObject(message, options) {
        if (!options)
            options = {};
        var object = {};
        if (options.defaults) {
            if ($util.Long) {
                var long = new $util.Long(0, 0, false);
                object.ts = options.longs === String ? long.toString() : options.longs === Number ? long.toNumber() : long;
            } else
                object.ts = options.longs === String ? "0" : 0;
            if ($util.Long) {
                var long = new $util.Long(0, 0, false);
                object.dur = options.longs === String ? long.toString() : options.longs === Number ? long.toNumber() : long;
            } else
                object.dur = options.longs === String ? "0" : 0;
            object.pid = 0;
            object.id = 0;
            object.name = 0;
            object.type = 0;
            object.jankTag = 0;
            object.dstSlice = 0;
            object.depth = 0;
        }
        if (message.ts != null && message.hasOwnProperty("ts"))
            if (typeof message.ts === "number")
                object.ts = options.longs === String ? String(message.ts) : message.ts;
            else
                object.ts = options.longs === String ? $util.Long.prototype.toString.call(message.ts) : options.longs === Number ? new $util.LongBits(message.ts.low >>> 0, message.ts.high >>> 0).toNumber() : message.ts;
        if (message.dur != null && message.hasOwnProperty("dur"))
            if (typeof message.dur === "number")
                object.dur = options.longs === String ? String(message.dur) : message.dur;
            else
                object.dur = options.longs === String ? $util.Long.prototype.toString.call(message.dur) : options.longs === Number ? new $util.LongBits(message.dur.low >>> 0, message.dur.high >>> 0).toNumber() : message.dur;
        if (message.pid != null && message.hasOwnProperty("pid"))
            object.pid = message.pid;
        if (message.id != null && message.hasOwnProperty("id"))
            object.id = message.id;
        if (message.name != null && message.hasOwnProperty("name"))
            object.name = message.name;
        if (message.type != null && message.hasOwnProperty("type"))
            object.type = message.type;
        if (message.jankTag != null && message.hasOwnProperty("jankTag"))
            object.jankTag = message.jankTag;
        if (message.dstSlice != null && message.hasOwnProperty("dstSlice"))
            object.dstSlice = message.dstSlice;
        if (message.depth != null && message.hasOwnProperty("depth"))
            object.depth = message.depth;
        return object;
    };

    /**
     * Converts this SphProcessJanksActualData to JSON.
     * @function toJSON
     * @memberof SphProcessJanksActualData
     * @instance
     * @returns {Object.<string,*>} JSON object
     */
    SphProcessJanksActualData.prototype.toJSON = function toJSON() {
        return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
    };

    /**
     * Gets the default type url for SphProcessJanksActualData
     * @function getTypeUrl
     * @memberof SphProcessJanksActualData
     * @static
     * @param {string} [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
     * @returns {string} The default type url
     */
    SphProcessJanksActualData.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
        if (typeUrlPrefix === undefined) {
            typeUrlPrefix = "type.googleapis.com";
        }
        return typeUrlPrefix + "/SphProcessJanksActualData";
    };

    return SphProcessJanksActualData;
})();

$root.SphNativeMemoryNormalData = (function() {

    /**
     * Properties of a SphNativeMemoryNormalData.
     * @exports ISphNativeMemoryNormalData
     * @interface ISphNativeMemoryNormalData
     * @property {number|Long|null} [startTime] SphNativeMemoryNormalData startTime
     * @property {number|Long|null} [heapSize] SphNativeMemoryNormalData heapSize
     * @property {number|Long|null} [eventType] SphNativeMemoryNormalData eventType
     * @property {number|Long|null} [ipid] SphNativeMemoryNormalData ipid
     */

    /**
     * Constructs a new SphNativeMemoryNormalData.
     * @exports SphNativeMemoryNormalData
     * @classdesc Represents a SphNativeMemoryNormalData.
     * @implements ISphNativeMemoryNormalData
     * @constructor
     * @param {ISphNativeMemoryNormalData=} [properties] Properties to set
     */
    function SphNativeMemoryNormalData(properties) {
        if (properties)
            for (var keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                if (properties[keys[i]] != null)
                    this[keys[i]] = properties[keys[i]];
    }

    /**
     * SphNativeMemoryNormalData startTime.
     * @member {number|Long} startTime
     * @memberof SphNativeMemoryNormalData
     * @instance
     */
    SphNativeMemoryNormalData.prototype.startTime = $util.Long ? $util.Long.fromBits(0,0,false) : 0;

    /**
     * SphNativeMemoryNormalData heapSize.
     * @member {number|Long} heapSize
     * @memberof SphNativeMemoryNormalData
     * @instance
     */
    SphNativeMemoryNormalData.prototype.heapSize = $util.Long ? $util.Long.fromBits(0,0,false) : 0;

    /**
     * SphNativeMemoryNormalData eventType.
     * @member {number|Long} eventType
     * @memberof SphNativeMemoryNormalData
     * @instance
     */
    SphNativeMemoryNormalData.prototype.eventType = $util.Long ? $util.Long.fromBits(0,0,false) : 0;

    /**
     * SphNativeMemoryNormalData ipid.
     * @member {number|Long} ipid
     * @memberof SphNativeMemoryNormalData
     * @instance
     */
    SphNativeMemoryNormalData.prototype.ipid = $util.Long ? $util.Long.fromBits(0,0,false) : 0;

    /**
     * Creates a new SphNativeMemoryNormalData instance using the specified properties.
     * @function create
     * @memberof SphNativeMemoryNormalData
     * @static
     * @param {ISphNativeMemoryNormalData=} [properties] Properties to set
     * @returns {SphNativeMemoryNormalData} SphNativeMemoryNormalData instance
     */
    SphNativeMemoryNormalData.create = function create(properties) {
        return new SphNativeMemoryNormalData(properties);
    };

    /**
     * Encodes the specified SphNativeMemoryNormalData message. Does not implicitly {@link SphNativeMemoryNormalData.verify|verify} messages.
     * @function encode
     * @memberof SphNativeMemoryNormalData
     * @static
     * @param {ISphNativeMemoryNormalData} message SphNativeMemoryNormalData message or plain object to encode
     * @param {$protobuf.Writer} [writer] Writer to encode to
     * @returns {$protobuf.Writer} Writer
     */
    SphNativeMemoryNormalData.encode = function encode(message, writer) {
        if (!writer)
            writer = $Writer.create();
        if (message.startTime != null && Object.hasOwnProperty.call(message, "startTime"))
            writer.uint32(/* id 1, wireType 0 =*/8).int64(message.startTime);
        if (message.heapSize != null && Object.hasOwnProperty.call(message, "heapSize"))
            writer.uint32(/* id 2, wireType 0 =*/16).int64(message.heapSize);
        if (message.eventType != null && Object.hasOwnProperty.call(message, "eventType"))
            writer.uint32(/* id 3, wireType 0 =*/24).int64(message.eventType);
        if (message.ipid != null && Object.hasOwnProperty.call(message, "ipid"))
            writer.uint32(/* id 4, wireType 0 =*/32).int64(message.ipid);
        return writer;
    };

    /**
     * Encodes the specified SphNativeMemoryNormalData message, length delimited. Does not implicitly {@link SphNativeMemoryNormalData.verify|verify} messages.
     * @function encodeDelimited
     * @memberof SphNativeMemoryNormalData
     * @static
     * @param {ISphNativeMemoryNormalData} message SphNativeMemoryNormalData message or plain object to encode
     * @param {$protobuf.Writer} [writer] Writer to encode to
     * @returns {$protobuf.Writer} Writer
     */
    SphNativeMemoryNormalData.encodeDelimited = function encodeDelimited(message, writer) {
        return this.encode(message, writer).ldelim();
    };

    /**
     * Decodes a SphNativeMemoryNormalData message from the specified reader or buffer.
     * @function decode
     * @memberof SphNativeMemoryNormalData
     * @static
     * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
     * @param {number} [length] Message length if known beforehand
     * @returns {SphNativeMemoryNormalData} SphNativeMemoryNormalData
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    SphNativeMemoryNormalData.decode = function decode(reader, length) {
        if (!(reader instanceof $Reader))
            reader = $Reader.create(reader);
        var end = length === undefined ? reader.len : reader.pos + length, message = new $root.SphNativeMemoryNormalData();
        while (reader.pos < end) {
            var tag = reader.uint32();
            switch (tag >>> 3) {
            case 1: {
                    message.startTime = reader.int64();
                    break;
                }
            case 2: {
                    message.heapSize = reader.int64();
                    break;
                }
            case 3: {
                    message.eventType = reader.int64();
                    break;
                }
            case 4: {
                    message.ipid = reader.int64();
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
     * Decodes a SphNativeMemoryNormalData message from the specified reader or buffer, length delimited.
     * @function decodeDelimited
     * @memberof SphNativeMemoryNormalData
     * @static
     * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
     * @returns {SphNativeMemoryNormalData} SphNativeMemoryNormalData
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    SphNativeMemoryNormalData.decodeDelimited = function decodeDelimited(reader) {
        if (!(reader instanceof $Reader))
            reader = new $Reader(reader);
        return this.decode(reader, reader.uint32());
    };

    /**
     * Verifies a SphNativeMemoryNormalData message.
     * @function verify
     * @memberof SphNativeMemoryNormalData
     * @static
     * @param {Object.<string,*>} message Plain object to verify
     * @returns {string|null} `null` if valid, otherwise the reason why it is not
     */
    SphNativeMemoryNormalData.verify = function verify(message) {
        if (typeof message !== "object" || message === null)
            return "object expected";
        if (message.startTime != null && message.hasOwnProperty("startTime"))
            if (!$util.isInteger(message.startTime) && !(message.startTime && $util.isInteger(message.startTime.low) && $util.isInteger(message.startTime.high)))
                return "startTime: integer|Long expected";
        if (message.heapSize != null && message.hasOwnProperty("heapSize"))
            if (!$util.isInteger(message.heapSize) && !(message.heapSize && $util.isInteger(message.heapSize.low) && $util.isInteger(message.heapSize.high)))
                return "heapSize: integer|Long expected";
        if (message.eventType != null && message.hasOwnProperty("eventType"))
            if (!$util.isInteger(message.eventType) && !(message.eventType && $util.isInteger(message.eventType.low) && $util.isInteger(message.eventType.high)))
                return "eventType: integer|Long expected";
        if (message.ipid != null && message.hasOwnProperty("ipid"))
            if (!$util.isInteger(message.ipid) && !(message.ipid && $util.isInteger(message.ipid.low) && $util.isInteger(message.ipid.high)))
                return "ipid: integer|Long expected";
        return null;
    };

    /**
     * Creates a SphNativeMemoryNormalData message from a plain object. Also converts values to their respective internal types.
     * @function fromObject
     * @memberof SphNativeMemoryNormalData
     * @static
     * @param {Object.<string,*>} object Plain object
     * @returns {SphNativeMemoryNormalData} SphNativeMemoryNormalData
     */
    SphNativeMemoryNormalData.fromObject = function fromObject(object) {
        if (object instanceof $root.SphNativeMemoryNormalData)
            return object;
        var message = new $root.SphNativeMemoryNormalData();
        if (object.startTime != null)
            if ($util.Long)
                (message.startTime = $util.Long.fromValue(object.startTime)).unsigned = false;
            else if (typeof object.startTime === "string")
                message.startTime = parseInt(object.startTime, 10);
            else if (typeof object.startTime === "number")
                message.startTime = object.startTime;
            else if (typeof object.startTime === "object")
                message.startTime = new $util.LongBits(object.startTime.low >>> 0, object.startTime.high >>> 0).toNumber();
        if (object.heapSize != null)
            if ($util.Long)
                (message.heapSize = $util.Long.fromValue(object.heapSize)).unsigned = false;
            else if (typeof object.heapSize === "string")
                message.heapSize = parseInt(object.heapSize, 10);
            else if (typeof object.heapSize === "number")
                message.heapSize = object.heapSize;
            else if (typeof object.heapSize === "object")
                message.heapSize = new $util.LongBits(object.heapSize.low >>> 0, object.heapSize.high >>> 0).toNumber();
        if (object.eventType != null)
            if ($util.Long)
                (message.eventType = $util.Long.fromValue(object.eventType)).unsigned = false;
            else if (typeof object.eventType === "string")
                message.eventType = parseInt(object.eventType, 10);
            else if (typeof object.eventType === "number")
                message.eventType = object.eventType;
            else if (typeof object.eventType === "object")
                message.eventType = new $util.LongBits(object.eventType.low >>> 0, object.eventType.high >>> 0).toNumber();
        if (object.ipid != null)
            if ($util.Long)
                (message.ipid = $util.Long.fromValue(object.ipid)).unsigned = false;
            else if (typeof object.ipid === "string")
                message.ipid = parseInt(object.ipid, 10);
            else if (typeof object.ipid === "number")
                message.ipid = object.ipid;
            else if (typeof object.ipid === "object")
                message.ipid = new $util.LongBits(object.ipid.low >>> 0, object.ipid.high >>> 0).toNumber();
        return message;
    };

    /**
     * Creates a plain object from a SphNativeMemoryNormalData message. Also converts values to other types if specified.
     * @function toObject
     * @memberof SphNativeMemoryNormalData
     * @static
     * @param {SphNativeMemoryNormalData} message SphNativeMemoryNormalData
     * @param {$protobuf.IConversionOptions} [options] Conversion options
     * @returns {Object.<string,*>} Plain object
     */
    SphNativeMemoryNormalData.toObject = function toObject(message, options) {
        if (!options)
            options = {};
        var object = {};
        if (options.defaults) {
            if ($util.Long) {
                var long = new $util.Long(0, 0, false);
                object.startTime = options.longs === String ? long.toString() : options.longs === Number ? long.toNumber() : long;
            } else
                object.startTime = options.longs === String ? "0" : 0;
            if ($util.Long) {
                var long = new $util.Long(0, 0, false);
                object.heapSize = options.longs === String ? long.toString() : options.longs === Number ? long.toNumber() : long;
            } else
                object.heapSize = options.longs === String ? "0" : 0;
            if ($util.Long) {
                var long = new $util.Long(0, 0, false);
                object.eventType = options.longs === String ? long.toString() : options.longs === Number ? long.toNumber() : long;
            } else
                object.eventType = options.longs === String ? "0" : 0;
            if ($util.Long) {
                var long = new $util.Long(0, 0, false);
                object.ipid = options.longs === String ? long.toString() : options.longs === Number ? long.toNumber() : long;
            } else
                object.ipid = options.longs === String ? "0" : 0;
        }
        if (message.startTime != null && message.hasOwnProperty("startTime"))
            if (typeof message.startTime === "number")
                object.startTime = options.longs === String ? String(message.startTime) : message.startTime;
            else
                object.startTime = options.longs === String ? $util.Long.prototype.toString.call(message.startTime) : options.longs === Number ? new $util.LongBits(message.startTime.low >>> 0, message.startTime.high >>> 0).toNumber() : message.startTime;
        if (message.heapSize != null && message.hasOwnProperty("heapSize"))
            if (typeof message.heapSize === "number")
                object.heapSize = options.longs === String ? String(message.heapSize) : message.heapSize;
            else
                object.heapSize = options.longs === String ? $util.Long.prototype.toString.call(message.heapSize) : options.longs === Number ? new $util.LongBits(message.heapSize.low >>> 0, message.heapSize.high >>> 0).toNumber() : message.heapSize;
        if (message.eventType != null && message.hasOwnProperty("eventType"))
            if (typeof message.eventType === "number")
                object.eventType = options.longs === String ? String(message.eventType) : message.eventType;
            else
                object.eventType = options.longs === String ? $util.Long.prototype.toString.call(message.eventType) : options.longs === Number ? new $util.LongBits(message.eventType.low >>> 0, message.eventType.high >>> 0).toNumber() : message.eventType;
        if (message.ipid != null && message.hasOwnProperty("ipid"))
            if (typeof message.ipid === "number")
                object.ipid = options.longs === String ? String(message.ipid) : message.ipid;
            else
                object.ipid = options.longs === String ? $util.Long.prototype.toString.call(message.ipid) : options.longs === Number ? new $util.LongBits(message.ipid.low >>> 0, message.ipid.high >>> 0).toNumber() : message.ipid;
        return object;
    };

    /**
     * Converts this SphNativeMemoryNormalData to JSON.
     * @function toJSON
     * @memberof SphNativeMemoryNormalData
     * @instance
     * @returns {Object.<string,*>} JSON object
     */
    SphNativeMemoryNormalData.prototype.toJSON = function toJSON() {
        return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
    };

    /**
     * Gets the default type url for SphNativeMemoryNormalData
     * @function getTypeUrl
     * @memberof SphNativeMemoryNormalData
     * @static
     * @param {string} [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
     * @returns {string} The default type url
     */
    SphNativeMemoryNormalData.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
        if (typeUrlPrefix === undefined) {
            typeUrlPrefix = "type.googleapis.com";
        }
        return typeUrlPrefix + "/SphNativeMemoryNormalData";
    };

    return SphNativeMemoryNormalData;
})();

$root.SphNativeMemoryStatisticData = (function() {

    /**
     * Properties of a SphNativeMemoryStatisticData.
     * @exports ISphNativeMemoryStatisticData
     * @interface ISphNativeMemoryStatisticData
     * @property {number|Long|null} [callchainId] SphNativeMemoryStatisticData callchainId
     * @property {number|Long|null} [startTs] SphNativeMemoryStatisticData startTs
     * @property {number|Long|null} [applyCount] SphNativeMemoryStatisticData applyCount
     * @property {number|Long|null} [applySize] SphNativeMemoryStatisticData applySize
     * @property {number|Long|null} [releaseCount] SphNativeMemoryStatisticData releaseCount
     * @property {number|Long|null} [releaseSize] SphNativeMemoryStatisticData releaseSize
     * @property {number|Long|null} [ipid] SphNativeMemoryStatisticData ipid
     * @property {number|Long|null} [type] SphNativeMemoryStatisticData type
     */

    /**
     * Constructs a new SphNativeMemoryStatisticData.
     * @exports SphNativeMemoryStatisticData
     * @classdesc Represents a SphNativeMemoryStatisticData.
     * @implements ISphNativeMemoryStatisticData
     * @constructor
     * @param {ISphNativeMemoryStatisticData=} [properties] Properties to set
     */
    function SphNativeMemoryStatisticData(properties) {
        if (properties)
            for (var keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                if (properties[keys[i]] != null)
                    this[keys[i]] = properties[keys[i]];
    }

    /**
     * SphNativeMemoryStatisticData callchainId.
     * @member {number|Long} callchainId
     * @memberof SphNativeMemoryStatisticData
     * @instance
     */
    SphNativeMemoryStatisticData.prototype.callchainId = $util.Long ? $util.Long.fromBits(0,0,false) : 0;

    /**
     * SphNativeMemoryStatisticData startTs.
     * @member {number|Long} startTs
     * @memberof SphNativeMemoryStatisticData
     * @instance
     */
    SphNativeMemoryStatisticData.prototype.startTs = $util.Long ? $util.Long.fromBits(0,0,false) : 0;

    /**
     * SphNativeMemoryStatisticData applyCount.
     * @member {number|Long} applyCount
     * @memberof SphNativeMemoryStatisticData
     * @instance
     */
    SphNativeMemoryStatisticData.prototype.applyCount = $util.Long ? $util.Long.fromBits(0,0,false) : 0;

    /**
     * SphNativeMemoryStatisticData applySize.
     * @member {number|Long} applySize
     * @memberof SphNativeMemoryStatisticData
     * @instance
     */
    SphNativeMemoryStatisticData.prototype.applySize = $util.Long ? $util.Long.fromBits(0,0,false) : 0;

    /**
     * SphNativeMemoryStatisticData releaseCount.
     * @member {number|Long} releaseCount
     * @memberof SphNativeMemoryStatisticData
     * @instance
     */
    SphNativeMemoryStatisticData.prototype.releaseCount = $util.Long ? $util.Long.fromBits(0,0,false) : 0;

    /**
     * SphNativeMemoryStatisticData releaseSize.
     * @member {number|Long} releaseSize
     * @memberof SphNativeMemoryStatisticData
     * @instance
     */
    SphNativeMemoryStatisticData.prototype.releaseSize = $util.Long ? $util.Long.fromBits(0,0,false) : 0;

    /**
     * SphNativeMemoryStatisticData ipid.
     * @member {number|Long} ipid
     * @memberof SphNativeMemoryStatisticData
     * @instance
     */
    SphNativeMemoryStatisticData.prototype.ipid = $util.Long ? $util.Long.fromBits(0,0,false) : 0;

    /**
     * SphNativeMemoryStatisticData type.
     * @member {number|Long} type
     * @memberof SphNativeMemoryStatisticData
     * @instance
     */
    SphNativeMemoryStatisticData.prototype.type = $util.Long ? $util.Long.fromBits(0,0,false) : 0;

    /**
     * Creates a new SphNativeMemoryStatisticData instance using the specified properties.
     * @function create
     * @memberof SphNativeMemoryStatisticData
     * @static
     * @param {ISphNativeMemoryStatisticData=} [properties] Properties to set
     * @returns {SphNativeMemoryStatisticData} SphNativeMemoryStatisticData instance
     */
    SphNativeMemoryStatisticData.create = function create(properties) {
        return new SphNativeMemoryStatisticData(properties);
    };

    /**
     * Encodes the specified SphNativeMemoryStatisticData message. Does not implicitly {@link SphNativeMemoryStatisticData.verify|verify} messages.
     * @function encode
     * @memberof SphNativeMemoryStatisticData
     * @static
     * @param {ISphNativeMemoryStatisticData} message SphNativeMemoryStatisticData message or plain object to encode
     * @param {$protobuf.Writer} [writer] Writer to encode to
     * @returns {$protobuf.Writer} Writer
     */
    SphNativeMemoryStatisticData.encode = function encode(message, writer) {
        if (!writer)
            writer = $Writer.create();
        if (message.callchainId != null && Object.hasOwnProperty.call(message, "callchainId"))
            writer.uint32(/* id 1, wireType 0 =*/8).int64(message.callchainId);
        if (message.startTs != null && Object.hasOwnProperty.call(message, "startTs"))
            writer.uint32(/* id 2, wireType 0 =*/16).int64(message.startTs);
        if (message.applyCount != null && Object.hasOwnProperty.call(message, "applyCount"))
            writer.uint32(/* id 3, wireType 0 =*/24).int64(message.applyCount);
        if (message.applySize != null && Object.hasOwnProperty.call(message, "applySize"))
            writer.uint32(/* id 4, wireType 0 =*/32).int64(message.applySize);
        if (message.releaseCount != null && Object.hasOwnProperty.call(message, "releaseCount"))
            writer.uint32(/* id 5, wireType 0 =*/40).int64(message.releaseCount);
        if (message.releaseSize != null && Object.hasOwnProperty.call(message, "releaseSize"))
            writer.uint32(/* id 6, wireType 0 =*/48).int64(message.releaseSize);
        if (message.ipid != null && Object.hasOwnProperty.call(message, "ipid"))
            writer.uint32(/* id 7, wireType 0 =*/56).int64(message.ipid);
        if (message.type != null && Object.hasOwnProperty.call(message, "type"))
            writer.uint32(/* id 8, wireType 0 =*/64).int64(message.type);
        return writer;
    };

    /**
     * Encodes the specified SphNativeMemoryStatisticData message, length delimited. Does not implicitly {@link SphNativeMemoryStatisticData.verify|verify} messages.
     * @function encodeDelimited
     * @memberof SphNativeMemoryStatisticData
     * @static
     * @param {ISphNativeMemoryStatisticData} message SphNativeMemoryStatisticData message or plain object to encode
     * @param {$protobuf.Writer} [writer] Writer to encode to
     * @returns {$protobuf.Writer} Writer
     */
    SphNativeMemoryStatisticData.encodeDelimited = function encodeDelimited(message, writer) {
        return this.encode(message, writer).ldelim();
    };

    /**
     * Decodes a SphNativeMemoryStatisticData message from the specified reader or buffer.
     * @function decode
     * @memberof SphNativeMemoryStatisticData
     * @static
     * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
     * @param {number} [length] Message length if known beforehand
     * @returns {SphNativeMemoryStatisticData} SphNativeMemoryStatisticData
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    SphNativeMemoryStatisticData.decode = function decode(reader, length) {
        if (!(reader instanceof $Reader))
            reader = $Reader.create(reader);
        var end = length === undefined ? reader.len : reader.pos + length, message = new $root.SphNativeMemoryStatisticData();
        while (reader.pos < end) {
            var tag = reader.uint32();
            switch (tag >>> 3) {
            case 1: {
                    message.callchainId = reader.int64();
                    break;
                }
            case 2: {
                    message.startTs = reader.int64();
                    break;
                }
            case 3: {
                    message.applyCount = reader.int64();
                    break;
                }
            case 4: {
                    message.applySize = reader.int64();
                    break;
                }
            case 5: {
                    message.releaseCount = reader.int64();
                    break;
                }
            case 6: {
                    message.releaseSize = reader.int64();
                    break;
                }
            case 7: {
                    message.ipid = reader.int64();
                    break;
                }
            case 8: {
                    message.type = reader.int64();
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
     * Decodes a SphNativeMemoryStatisticData message from the specified reader or buffer, length delimited.
     * @function decodeDelimited
     * @memberof SphNativeMemoryStatisticData
     * @static
     * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
     * @returns {SphNativeMemoryStatisticData} SphNativeMemoryStatisticData
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    SphNativeMemoryStatisticData.decodeDelimited = function decodeDelimited(reader) {
        if (!(reader instanceof $Reader))
            reader = new $Reader(reader);
        return this.decode(reader, reader.uint32());
    };

    /**
     * Verifies a SphNativeMemoryStatisticData message.
     * @function verify
     * @memberof SphNativeMemoryStatisticData
     * @static
     * @param {Object.<string,*>} message Plain object to verify
     * @returns {string|null} `null` if valid, otherwise the reason why it is not
     */
    SphNativeMemoryStatisticData.verify = function verify(message) {
        if (typeof message !== "object" || message === null)
            return "object expected";
        if (message.callchainId != null && message.hasOwnProperty("callchainId"))
            if (!$util.isInteger(message.callchainId) && !(message.callchainId && $util.isInteger(message.callchainId.low) && $util.isInteger(message.callchainId.high)))
                return "callchainId: integer|Long expected";
        if (message.startTs != null && message.hasOwnProperty("startTs"))
            if (!$util.isInteger(message.startTs) && !(message.startTs && $util.isInteger(message.startTs.low) && $util.isInteger(message.startTs.high)))
                return "startTs: integer|Long expected";
        if (message.applyCount != null && message.hasOwnProperty("applyCount"))
            if (!$util.isInteger(message.applyCount) && !(message.applyCount && $util.isInteger(message.applyCount.low) && $util.isInteger(message.applyCount.high)))
                return "applyCount: integer|Long expected";
        if (message.applySize != null && message.hasOwnProperty("applySize"))
            if (!$util.isInteger(message.applySize) && !(message.applySize && $util.isInteger(message.applySize.low) && $util.isInteger(message.applySize.high)))
                return "applySize: integer|Long expected";
        if (message.releaseCount != null && message.hasOwnProperty("releaseCount"))
            if (!$util.isInteger(message.releaseCount) && !(message.releaseCount && $util.isInteger(message.releaseCount.low) && $util.isInteger(message.releaseCount.high)))
                return "releaseCount: integer|Long expected";
        if (message.releaseSize != null && message.hasOwnProperty("releaseSize"))
            if (!$util.isInteger(message.releaseSize) && !(message.releaseSize && $util.isInteger(message.releaseSize.low) && $util.isInteger(message.releaseSize.high)))
                return "releaseSize: integer|Long expected";
        if (message.ipid != null && message.hasOwnProperty("ipid"))
            if (!$util.isInteger(message.ipid) && !(message.ipid && $util.isInteger(message.ipid.low) && $util.isInteger(message.ipid.high)))
                return "ipid: integer|Long expected";
        if (message.type != null && message.hasOwnProperty("type"))
            if (!$util.isInteger(message.type) && !(message.type && $util.isInteger(message.type.low) && $util.isInteger(message.type.high)))
                return "type: integer|Long expected";
        return null;
    };

    /**
     * Creates a SphNativeMemoryStatisticData message from a plain object. Also converts values to their respective internal types.
     * @function fromObject
     * @memberof SphNativeMemoryStatisticData
     * @static
     * @param {Object.<string,*>} object Plain object
     * @returns {SphNativeMemoryStatisticData} SphNativeMemoryStatisticData
     */
    SphNativeMemoryStatisticData.fromObject = function fromObject(object) {
        if (object instanceof $root.SphNativeMemoryStatisticData)
            return object;
        var message = new $root.SphNativeMemoryStatisticData();
        if (object.callchainId != null)
            if ($util.Long)
                (message.callchainId = $util.Long.fromValue(object.callchainId)).unsigned = false;
            else if (typeof object.callchainId === "string")
                message.callchainId = parseInt(object.callchainId, 10);
            else if (typeof object.callchainId === "number")
                message.callchainId = object.callchainId;
            else if (typeof object.callchainId === "object")
                message.callchainId = new $util.LongBits(object.callchainId.low >>> 0, object.callchainId.high >>> 0).toNumber();
        if (object.startTs != null)
            if ($util.Long)
                (message.startTs = $util.Long.fromValue(object.startTs)).unsigned = false;
            else if (typeof object.startTs === "string")
                message.startTs = parseInt(object.startTs, 10);
            else if (typeof object.startTs === "number")
                message.startTs = object.startTs;
            else if (typeof object.startTs === "object")
                message.startTs = new $util.LongBits(object.startTs.low >>> 0, object.startTs.high >>> 0).toNumber();
        if (object.applyCount != null)
            if ($util.Long)
                (message.applyCount = $util.Long.fromValue(object.applyCount)).unsigned = false;
            else if (typeof object.applyCount === "string")
                message.applyCount = parseInt(object.applyCount, 10);
            else if (typeof object.applyCount === "number")
                message.applyCount = object.applyCount;
            else if (typeof object.applyCount === "object")
                message.applyCount = new $util.LongBits(object.applyCount.low >>> 0, object.applyCount.high >>> 0).toNumber();
        if (object.applySize != null)
            if ($util.Long)
                (message.applySize = $util.Long.fromValue(object.applySize)).unsigned = false;
            else if (typeof object.applySize === "string")
                message.applySize = parseInt(object.applySize, 10);
            else if (typeof object.applySize === "number")
                message.applySize = object.applySize;
            else if (typeof object.applySize === "object")
                message.applySize = new $util.LongBits(object.applySize.low >>> 0, object.applySize.high >>> 0).toNumber();
        if (object.releaseCount != null)
            if ($util.Long)
                (message.releaseCount = $util.Long.fromValue(object.releaseCount)).unsigned = false;
            else if (typeof object.releaseCount === "string")
                message.releaseCount = parseInt(object.releaseCount, 10);
            else if (typeof object.releaseCount === "number")
                message.releaseCount = object.releaseCount;
            else if (typeof object.releaseCount === "object")
                message.releaseCount = new $util.LongBits(object.releaseCount.low >>> 0, object.releaseCount.high >>> 0).toNumber();
        if (object.releaseSize != null)
            if ($util.Long)
                (message.releaseSize = $util.Long.fromValue(object.releaseSize)).unsigned = false;
            else if (typeof object.releaseSize === "string")
                message.releaseSize = parseInt(object.releaseSize, 10);
            else if (typeof object.releaseSize === "number")
                message.releaseSize = object.releaseSize;
            else if (typeof object.releaseSize === "object")
                message.releaseSize = new $util.LongBits(object.releaseSize.low >>> 0, object.releaseSize.high >>> 0).toNumber();
        if (object.ipid != null)
            if ($util.Long)
                (message.ipid = $util.Long.fromValue(object.ipid)).unsigned = false;
            else if (typeof object.ipid === "string")
                message.ipid = parseInt(object.ipid, 10);
            else if (typeof object.ipid === "number")
                message.ipid = object.ipid;
            else if (typeof object.ipid === "object")
                message.ipid = new $util.LongBits(object.ipid.low >>> 0, object.ipid.high >>> 0).toNumber();
        if (object.type != null)
            if ($util.Long)
                (message.type = $util.Long.fromValue(object.type)).unsigned = false;
            else if (typeof object.type === "string")
                message.type = parseInt(object.type, 10);
            else if (typeof object.type === "number")
                message.type = object.type;
            else if (typeof object.type === "object")
                message.type = new $util.LongBits(object.type.low >>> 0, object.type.high >>> 0).toNumber();
        return message;
    };

    /**
     * Creates a plain object from a SphNativeMemoryStatisticData message. Also converts values to other types if specified.
     * @function toObject
     * @memberof SphNativeMemoryStatisticData
     * @static
     * @param {SphNativeMemoryStatisticData} message SphNativeMemoryStatisticData
     * @param {$protobuf.IConversionOptions} [options] Conversion options
     * @returns {Object.<string,*>} Plain object
     */
    SphNativeMemoryStatisticData.toObject = function toObject(message, options) {
        if (!options)
            options = {};
        var object = {};
        if (options.defaults) {
            if ($util.Long) {
                var long = new $util.Long(0, 0, false);
                object.callchainId = options.longs === String ? long.toString() : options.longs === Number ? long.toNumber() : long;
            } else
                object.callchainId = options.longs === String ? "0" : 0;
            if ($util.Long) {
                var long = new $util.Long(0, 0, false);
                object.startTs = options.longs === String ? long.toString() : options.longs === Number ? long.toNumber() : long;
            } else
                object.startTs = options.longs === String ? "0" : 0;
            if ($util.Long) {
                var long = new $util.Long(0, 0, false);
                object.applyCount = options.longs === String ? long.toString() : options.longs === Number ? long.toNumber() : long;
            } else
                object.applyCount = options.longs === String ? "0" : 0;
            if ($util.Long) {
                var long = new $util.Long(0, 0, false);
                object.applySize = options.longs === String ? long.toString() : options.longs === Number ? long.toNumber() : long;
            } else
                object.applySize = options.longs === String ? "0" : 0;
            if ($util.Long) {
                var long = new $util.Long(0, 0, false);
                object.releaseCount = options.longs === String ? long.toString() : options.longs === Number ? long.toNumber() : long;
            } else
                object.releaseCount = options.longs === String ? "0" : 0;
            if ($util.Long) {
                var long = new $util.Long(0, 0, false);
                object.releaseSize = options.longs === String ? long.toString() : options.longs === Number ? long.toNumber() : long;
            } else
                object.releaseSize = options.longs === String ? "0" : 0;
            if ($util.Long) {
                var long = new $util.Long(0, 0, false);
                object.ipid = options.longs === String ? long.toString() : options.longs === Number ? long.toNumber() : long;
            } else
                object.ipid = options.longs === String ? "0" : 0;
            if ($util.Long) {
                var long = new $util.Long(0, 0, false);
                object.type = options.longs === String ? long.toString() : options.longs === Number ? long.toNumber() : long;
            } else
                object.type = options.longs === String ? "0" : 0;
        }
        if (message.callchainId != null && message.hasOwnProperty("callchainId"))
            if (typeof message.callchainId === "number")
                object.callchainId = options.longs === String ? String(message.callchainId) : message.callchainId;
            else
                object.callchainId = options.longs === String ? $util.Long.prototype.toString.call(message.callchainId) : options.longs === Number ? new $util.LongBits(message.callchainId.low >>> 0, message.callchainId.high >>> 0).toNumber() : message.callchainId;
        if (message.startTs != null && message.hasOwnProperty("startTs"))
            if (typeof message.startTs === "number")
                object.startTs = options.longs === String ? String(message.startTs) : message.startTs;
            else
                object.startTs = options.longs === String ? $util.Long.prototype.toString.call(message.startTs) : options.longs === Number ? new $util.LongBits(message.startTs.low >>> 0, message.startTs.high >>> 0).toNumber() : message.startTs;
        if (message.applyCount != null && message.hasOwnProperty("applyCount"))
            if (typeof message.applyCount === "number")
                object.applyCount = options.longs === String ? String(message.applyCount) : message.applyCount;
            else
                object.applyCount = options.longs === String ? $util.Long.prototype.toString.call(message.applyCount) : options.longs === Number ? new $util.LongBits(message.applyCount.low >>> 0, message.applyCount.high >>> 0).toNumber() : message.applyCount;
        if (message.applySize != null && message.hasOwnProperty("applySize"))
            if (typeof message.applySize === "number")
                object.applySize = options.longs === String ? String(message.applySize) : message.applySize;
            else
                object.applySize = options.longs === String ? $util.Long.prototype.toString.call(message.applySize) : options.longs === Number ? new $util.LongBits(message.applySize.low >>> 0, message.applySize.high >>> 0).toNumber() : message.applySize;
        if (message.releaseCount != null && message.hasOwnProperty("releaseCount"))
            if (typeof message.releaseCount === "number")
                object.releaseCount = options.longs === String ? String(message.releaseCount) : message.releaseCount;
            else
                object.releaseCount = options.longs === String ? $util.Long.prototype.toString.call(message.releaseCount) : options.longs === Number ? new $util.LongBits(message.releaseCount.low >>> 0, message.releaseCount.high >>> 0).toNumber() : message.releaseCount;
        if (message.releaseSize != null && message.hasOwnProperty("releaseSize"))
            if (typeof message.releaseSize === "number")
                object.releaseSize = options.longs === String ? String(message.releaseSize) : message.releaseSize;
            else
                object.releaseSize = options.longs === String ? $util.Long.prototype.toString.call(message.releaseSize) : options.longs === Number ? new $util.LongBits(message.releaseSize.low >>> 0, message.releaseSize.high >>> 0).toNumber() : message.releaseSize;
        if (message.ipid != null && message.hasOwnProperty("ipid"))
            if (typeof message.ipid === "number")
                object.ipid = options.longs === String ? String(message.ipid) : message.ipid;
            else
                object.ipid = options.longs === String ? $util.Long.prototype.toString.call(message.ipid) : options.longs === Number ? new $util.LongBits(message.ipid.low >>> 0, message.ipid.high >>> 0).toNumber() : message.ipid;
        if (message.type != null && message.hasOwnProperty("type"))
            if (typeof message.type === "number")
                object.type = options.longs === String ? String(message.type) : message.type;
            else
                object.type = options.longs === String ? $util.Long.prototype.toString.call(message.type) : options.longs === Number ? new $util.LongBits(message.type.low >>> 0, message.type.high >>> 0).toNumber() : message.type;
        return object;
    };

    /**
     * Converts this SphNativeMemoryStatisticData to JSON.
     * @function toJSON
     * @memberof SphNativeMemoryStatisticData
     * @instance
     * @returns {Object.<string,*>} JSON object
     */
    SphNativeMemoryStatisticData.prototype.toJSON = function toJSON() {
        return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
    };

    /**
     * Gets the default type url for SphNativeMemoryStatisticData
     * @function getTypeUrl
     * @memberof SphNativeMemoryStatisticData
     * @static
     * @param {string} [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
     * @returns {string} The default type url
     */
    SphNativeMemoryStatisticData.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
        if (typeUrlPrefix === undefined) {
            typeUrlPrefix = "type.googleapis.com";
        }
        return typeUrlPrefix + "/SphNativeMemoryStatisticData";
    };

    return SphNativeMemoryStatisticData;
})();

$root.SphHeapFilesData = (function() {

    /**
     * Properties of a SphHeapFilesData.
     * @exports ISphHeapFilesData
     * @interface ISphHeapFilesData
     * @property {number|Long|null} [id] SphHeapFilesData id
     * @property {string|null} [name] SphHeapFilesData name
     * @property {number|Long|null} [startTs] SphHeapFilesData startTs
     * @property {number|Long|null} [endTs] SphHeapFilesData endTs
     * @property {number|Long|null} [size] SphHeapFilesData size
     * @property {number|null} [pid] SphHeapFilesData pid
     */

    /**
     * Constructs a new SphHeapFilesData.
     * @exports SphHeapFilesData
     * @classdesc Represents a SphHeapFilesData.
     * @implements ISphHeapFilesData
     * @constructor
     * @param {ISphHeapFilesData=} [properties] Properties to set
     */
    function SphHeapFilesData(properties) {
        if (properties)
            for (var keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                if (properties[keys[i]] != null)
                    this[keys[i]] = properties[keys[i]];
    }

    /**
     * SphHeapFilesData id.
     * @member {number|Long} id
     * @memberof SphHeapFilesData
     * @instance
     */
    SphHeapFilesData.prototype.id = $util.Long ? $util.Long.fromBits(0,0,false) : 0;

    /**
     * SphHeapFilesData name.
     * @member {string} name
     * @memberof SphHeapFilesData
     * @instance
     */
    SphHeapFilesData.prototype.name = "";

    /**
     * SphHeapFilesData startTs.
     * @member {number|Long} startTs
     * @memberof SphHeapFilesData
     * @instance
     */
    SphHeapFilesData.prototype.startTs = $util.Long ? $util.Long.fromBits(0,0,false) : 0;

    /**
     * SphHeapFilesData endTs.
     * @member {number|Long} endTs
     * @memberof SphHeapFilesData
     * @instance
     */
    SphHeapFilesData.prototype.endTs = $util.Long ? $util.Long.fromBits(0,0,false) : 0;

    /**
     * SphHeapFilesData size.
     * @member {number|Long} size
     * @memberof SphHeapFilesData
     * @instance
     */
    SphHeapFilesData.prototype.size = $util.Long ? $util.Long.fromBits(0,0,false) : 0;

    /**
     * SphHeapFilesData pid.
     * @member {number} pid
     * @memberof SphHeapFilesData
     * @instance
     */
    SphHeapFilesData.prototype.pid = 0;

    /**
     * Creates a new SphHeapFilesData instance using the specified properties.
     * @function create
     * @memberof SphHeapFilesData
     * @static
     * @param {ISphHeapFilesData=} [properties] Properties to set
     * @returns {SphHeapFilesData} SphHeapFilesData instance
     */
    SphHeapFilesData.create = function create(properties) {
        return new SphHeapFilesData(properties);
    };

    /**
     * Encodes the specified SphHeapFilesData message. Does not implicitly {@link SphHeapFilesData.verify|verify} messages.
     * @function encode
     * @memberof SphHeapFilesData
     * @static
     * @param {ISphHeapFilesData} message SphHeapFilesData message or plain object to encode
     * @param {$protobuf.Writer} [writer] Writer to encode to
     * @returns {$protobuf.Writer} Writer
     */
    SphHeapFilesData.encode = function encode(message, writer) {
        if (!writer)
            writer = $Writer.create();
        if (message.id != null && Object.hasOwnProperty.call(message, "id"))
            writer.uint32(/* id 1, wireType 0 =*/8).int64(message.id);
        if (message.name != null && Object.hasOwnProperty.call(message, "name"))
            writer.uint32(/* id 2, wireType 2 =*/18).string(message.name);
        if (message.startTs != null && Object.hasOwnProperty.call(message, "startTs"))
            writer.uint32(/* id 3, wireType 0 =*/24).int64(message.startTs);
        if (message.endTs != null && Object.hasOwnProperty.call(message, "endTs"))
            writer.uint32(/* id 4, wireType 0 =*/32).int64(message.endTs);
        if (message.size != null && Object.hasOwnProperty.call(message, "size"))
            writer.uint32(/* id 5, wireType 0 =*/40).int64(message.size);
        if (message.pid != null && Object.hasOwnProperty.call(message, "pid"))
            writer.uint32(/* id 6, wireType 0 =*/48).int32(message.pid);
        return writer;
    };

    /**
     * Encodes the specified SphHeapFilesData message, length delimited. Does not implicitly {@link SphHeapFilesData.verify|verify} messages.
     * @function encodeDelimited
     * @memberof SphHeapFilesData
     * @static
     * @param {ISphHeapFilesData} message SphHeapFilesData message or plain object to encode
     * @param {$protobuf.Writer} [writer] Writer to encode to
     * @returns {$protobuf.Writer} Writer
     */
    SphHeapFilesData.encodeDelimited = function encodeDelimited(message, writer) {
        return this.encode(message, writer).ldelim();
    };

    /**
     * Decodes a SphHeapFilesData message from the specified reader or buffer.
     * @function decode
     * @memberof SphHeapFilesData
     * @static
     * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
     * @param {number} [length] Message length if known beforehand
     * @returns {SphHeapFilesData} SphHeapFilesData
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    SphHeapFilesData.decode = function decode(reader, length) {
        if (!(reader instanceof $Reader))
            reader = $Reader.create(reader);
        var end = length === undefined ? reader.len : reader.pos + length, message = new $root.SphHeapFilesData();
        while (reader.pos < end) {
            var tag = reader.uint32();
            switch (tag >>> 3) {
            case 1: {
                    message.id = reader.int64();
                    break;
                }
            case 2: {
                    message.name = reader.string();
                    break;
                }
            case 3: {
                    message.startTs = reader.int64();
                    break;
                }
            case 4: {
                    message.endTs = reader.int64();
                    break;
                }
            case 5: {
                    message.size = reader.int64();
                    break;
                }
            case 6: {
                    message.pid = reader.int32();
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
     * Decodes a SphHeapFilesData message from the specified reader or buffer, length delimited.
     * @function decodeDelimited
     * @memberof SphHeapFilesData
     * @static
     * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
     * @returns {SphHeapFilesData} SphHeapFilesData
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    SphHeapFilesData.decodeDelimited = function decodeDelimited(reader) {
        if (!(reader instanceof $Reader))
            reader = new $Reader(reader);
        return this.decode(reader, reader.uint32());
    };

    /**
     * Verifies a SphHeapFilesData message.
     * @function verify
     * @memberof SphHeapFilesData
     * @static
     * @param {Object.<string,*>} message Plain object to verify
     * @returns {string|null} `null` if valid, otherwise the reason why it is not
     */
    SphHeapFilesData.verify = function verify(message) {
        if (typeof message !== "object" || message === null)
            return "object expected";
        if (message.id != null && message.hasOwnProperty("id"))
            if (!$util.isInteger(message.id) && !(message.id && $util.isInteger(message.id.low) && $util.isInteger(message.id.high)))
                return "id: integer|Long expected";
        if (message.name != null && message.hasOwnProperty("name"))
            if (!$util.isString(message.name))
                return "name: string expected";
        if (message.startTs != null && message.hasOwnProperty("startTs"))
            if (!$util.isInteger(message.startTs) && !(message.startTs && $util.isInteger(message.startTs.low) && $util.isInteger(message.startTs.high)))
                return "startTs: integer|Long expected";
        if (message.endTs != null && message.hasOwnProperty("endTs"))
            if (!$util.isInteger(message.endTs) && !(message.endTs && $util.isInteger(message.endTs.low) && $util.isInteger(message.endTs.high)))
                return "endTs: integer|Long expected";
        if (message.size != null && message.hasOwnProperty("size"))
            if (!$util.isInteger(message.size) && !(message.size && $util.isInteger(message.size.low) && $util.isInteger(message.size.high)))
                return "size: integer|Long expected";
        if (message.pid != null && message.hasOwnProperty("pid"))
            if (!$util.isInteger(message.pid))
                return "pid: integer expected";
        return null;
    };

    /**
     * Creates a SphHeapFilesData message from a plain object. Also converts values to their respective internal types.
     * @function fromObject
     * @memberof SphHeapFilesData
     * @static
     * @param {Object.<string,*>} object Plain object
     * @returns {SphHeapFilesData} SphHeapFilesData
     */
    SphHeapFilesData.fromObject = function fromObject(object) {
        if (object instanceof $root.SphHeapFilesData)
            return object;
        var message = new $root.SphHeapFilesData();
        if (object.id != null)
            if ($util.Long)
                (message.id = $util.Long.fromValue(object.id)).unsigned = false;
            else if (typeof object.id === "string")
                message.id = parseInt(object.id, 10);
            else if (typeof object.id === "number")
                message.id = object.id;
            else if (typeof object.id === "object")
                message.id = new $util.LongBits(object.id.low >>> 0, object.id.high >>> 0).toNumber();
        if (object.name != null)
            message.name = String(object.name);
        if (object.startTs != null)
            if ($util.Long)
                (message.startTs = $util.Long.fromValue(object.startTs)).unsigned = false;
            else if (typeof object.startTs === "string")
                message.startTs = parseInt(object.startTs, 10);
            else if (typeof object.startTs === "number")
                message.startTs = object.startTs;
            else if (typeof object.startTs === "object")
                message.startTs = new $util.LongBits(object.startTs.low >>> 0, object.startTs.high >>> 0).toNumber();
        if (object.endTs != null)
            if ($util.Long)
                (message.endTs = $util.Long.fromValue(object.endTs)).unsigned = false;
            else if (typeof object.endTs === "string")
                message.endTs = parseInt(object.endTs, 10);
            else if (typeof object.endTs === "number")
                message.endTs = object.endTs;
            else if (typeof object.endTs === "object")
                message.endTs = new $util.LongBits(object.endTs.low >>> 0, object.endTs.high >>> 0).toNumber();
        if (object.size != null)
            if ($util.Long)
                (message.size = $util.Long.fromValue(object.size)).unsigned = false;
            else if (typeof object.size === "string")
                message.size = parseInt(object.size, 10);
            else if (typeof object.size === "number")
                message.size = object.size;
            else if (typeof object.size === "object")
                message.size = new $util.LongBits(object.size.low >>> 0, object.size.high >>> 0).toNumber();
        if (object.pid != null)
            message.pid = object.pid | 0;
        return message;
    };

    /**
     * Creates a plain object from a SphHeapFilesData message. Also converts values to other types if specified.
     * @function toObject
     * @memberof SphHeapFilesData
     * @static
     * @param {SphHeapFilesData} message SphHeapFilesData
     * @param {$protobuf.IConversionOptions} [options] Conversion options
     * @returns {Object.<string,*>} Plain object
     */
    SphHeapFilesData.toObject = function toObject(message, options) {
        if (!options)
            options = {};
        var object = {};
        if (options.defaults) {
            if ($util.Long) {
                var long = new $util.Long(0, 0, false);
                object.id = options.longs === String ? long.toString() : options.longs === Number ? long.toNumber() : long;
            } else
                object.id = options.longs === String ? "0" : 0;
            object.name = "";
            if ($util.Long) {
                var long = new $util.Long(0, 0, false);
                object.startTs = options.longs === String ? long.toString() : options.longs === Number ? long.toNumber() : long;
            } else
                object.startTs = options.longs === String ? "0" : 0;
            if ($util.Long) {
                var long = new $util.Long(0, 0, false);
                object.endTs = options.longs === String ? long.toString() : options.longs === Number ? long.toNumber() : long;
            } else
                object.endTs = options.longs === String ? "0" : 0;
            if ($util.Long) {
                var long = new $util.Long(0, 0, false);
                object.size = options.longs === String ? long.toString() : options.longs === Number ? long.toNumber() : long;
            } else
                object.size = options.longs === String ? "0" : 0;
            object.pid = 0;
        }
        if (message.id != null && message.hasOwnProperty("id"))
            if (typeof message.id === "number")
                object.id = options.longs === String ? String(message.id) : message.id;
            else
                object.id = options.longs === String ? $util.Long.prototype.toString.call(message.id) : options.longs === Number ? new $util.LongBits(message.id.low >>> 0, message.id.high >>> 0).toNumber() : message.id;
        if (message.name != null && message.hasOwnProperty("name"))
            object.name = message.name;
        if (message.startTs != null && message.hasOwnProperty("startTs"))
            if (typeof message.startTs === "number")
                object.startTs = options.longs === String ? String(message.startTs) : message.startTs;
            else
                object.startTs = options.longs === String ? $util.Long.prototype.toString.call(message.startTs) : options.longs === Number ? new $util.LongBits(message.startTs.low >>> 0, message.startTs.high >>> 0).toNumber() : message.startTs;
        if (message.endTs != null && message.hasOwnProperty("endTs"))
            if (typeof message.endTs === "number")
                object.endTs = options.longs === String ? String(message.endTs) : message.endTs;
            else
                object.endTs = options.longs === String ? $util.Long.prototype.toString.call(message.endTs) : options.longs === Number ? new $util.LongBits(message.endTs.low >>> 0, message.endTs.high >>> 0).toNumber() : message.endTs;
        if (message.size != null && message.hasOwnProperty("size"))
            if (typeof message.size === "number")
                object.size = options.longs === String ? String(message.size) : message.size;
            else
                object.size = options.longs === String ? $util.Long.prototype.toString.call(message.size) : options.longs === Number ? new $util.LongBits(message.size.low >>> 0, message.size.high >>> 0).toNumber() : message.size;
        if (message.pid != null && message.hasOwnProperty("pid"))
            object.pid = message.pid;
        return object;
    };

    /**
     * Converts this SphHeapFilesData to JSON.
     * @function toJSON
     * @memberof SphHeapFilesData
     * @instance
     * @returns {Object.<string,*>} JSON object
     */
    SphHeapFilesData.prototype.toJSON = function toJSON() {
        return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
    };

    /**
     * Gets the default type url for SphHeapFilesData
     * @function getTypeUrl
     * @memberof SphHeapFilesData
     * @static
     * @param {string} [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
     * @returns {string} The default type url
     */
    SphHeapFilesData.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
        if (typeUrlPrefix === undefined) {
            typeUrlPrefix = "type.googleapis.com";
        }
        return typeUrlPrefix + "/SphHeapFilesData";
    };

    return SphHeapFilesData;
})();

$root.SphCpuProfilerData = (function() {

    /**
     * Properties of a SphCpuProfilerData.
     * @exports ISphCpuProfilerData
     * @interface ISphCpuProfilerData
     * @property {number|Long|null} [id] SphCpuProfilerData id
     * @property {number|Long|null} [functionId] SphCpuProfilerData functionId
     * @property {number|Long|null} [startTime] SphCpuProfilerData startTime
     * @property {number|Long|null} [endTime] SphCpuProfilerData endTime
     * @property {number|Long|null} [dur] SphCpuProfilerData dur
     * @property {number|Long|null} [nameId] SphCpuProfilerData nameId
     * @property {number|Long|null} [urlId] SphCpuProfilerData urlId
     * @property {number|Long|null} [line] SphCpuProfilerData line
     * @property {number|Long|null} [column] SphCpuProfilerData column
     * @property {number|Long|null} [hitCount] SphCpuProfilerData hitCount
     * @property {number|Long|null} [childrenString] SphCpuProfilerData childrenString
     * @property {number|Long|null} [parentId] SphCpuProfilerData parentId
     */

    /**
     * Constructs a new SphCpuProfilerData.
     * @exports SphCpuProfilerData
     * @classdesc Represents a SphCpuProfilerData.
     * @implements ISphCpuProfilerData
     * @constructor
     * @param {ISphCpuProfilerData=} [properties] Properties to set
     */
    function SphCpuProfilerData(properties) {
        if (properties)
            for (var keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                if (properties[keys[i]] != null)
                    this[keys[i]] = properties[keys[i]];
    }

    /**
     * SphCpuProfilerData id.
     * @member {number|Long} id
     * @memberof SphCpuProfilerData
     * @instance
     */
    SphCpuProfilerData.prototype.id = $util.Long ? $util.Long.fromBits(0,0,false) : 0;

    /**
     * SphCpuProfilerData functionId.
     * @member {number|Long} functionId
     * @memberof SphCpuProfilerData
     * @instance
     */
    SphCpuProfilerData.prototype.functionId = $util.Long ? $util.Long.fromBits(0,0,false) : 0;

    /**
     * SphCpuProfilerData startTime.
     * @member {number|Long} startTime
     * @memberof SphCpuProfilerData
     * @instance
     */
    SphCpuProfilerData.prototype.startTime = $util.Long ? $util.Long.fromBits(0,0,false) : 0;

    /**
     * SphCpuProfilerData endTime.
     * @member {number|Long} endTime
     * @memberof SphCpuProfilerData
     * @instance
     */
    SphCpuProfilerData.prototype.endTime = $util.Long ? $util.Long.fromBits(0,0,false) : 0;

    /**
     * SphCpuProfilerData dur.
     * @member {number|Long} dur
     * @memberof SphCpuProfilerData
     * @instance
     */
    SphCpuProfilerData.prototype.dur = $util.Long ? $util.Long.fromBits(0,0,false) : 0;

    /**
     * SphCpuProfilerData nameId.
     * @member {number|Long} nameId
     * @memberof SphCpuProfilerData
     * @instance
     */
    SphCpuProfilerData.prototype.nameId = $util.Long ? $util.Long.fromBits(0,0,false) : 0;

    /**
     * SphCpuProfilerData urlId.
     * @member {number|Long} urlId
     * @memberof SphCpuProfilerData
     * @instance
     */
    SphCpuProfilerData.prototype.urlId = $util.Long ? $util.Long.fromBits(0,0,false) : 0;

    /**
     * SphCpuProfilerData line.
     * @member {number|Long} line
     * @memberof SphCpuProfilerData
     * @instance
     */
    SphCpuProfilerData.prototype.line = $util.Long ? $util.Long.fromBits(0,0,false) : 0;

    /**
     * SphCpuProfilerData column.
     * @member {number|Long} column
     * @memberof SphCpuProfilerData
     * @instance
     */
    SphCpuProfilerData.prototype.column = $util.Long ? $util.Long.fromBits(0,0,false) : 0;

    /**
     * SphCpuProfilerData hitCount.
     * @member {number|Long} hitCount
     * @memberof SphCpuProfilerData
     * @instance
     */
    SphCpuProfilerData.prototype.hitCount = $util.Long ? $util.Long.fromBits(0,0,false) : 0;

    /**
     * SphCpuProfilerData childrenString.
     * @member {number|Long} childrenString
     * @memberof SphCpuProfilerData
     * @instance
     */
    SphCpuProfilerData.prototype.childrenString = $util.Long ? $util.Long.fromBits(0,0,false) : 0;

    /**
     * SphCpuProfilerData parentId.
     * @member {number|Long} parentId
     * @memberof SphCpuProfilerData
     * @instance
     */
    SphCpuProfilerData.prototype.parentId = $util.Long ? $util.Long.fromBits(0,0,false) : 0;

    /**
     * Creates a new SphCpuProfilerData instance using the specified properties.
     * @function create
     * @memberof SphCpuProfilerData
     * @static
     * @param {ISphCpuProfilerData=} [properties] Properties to set
     * @returns {SphCpuProfilerData} SphCpuProfilerData instance
     */
    SphCpuProfilerData.create = function create(properties) {
        return new SphCpuProfilerData(properties);
    };

    /**
     * Encodes the specified SphCpuProfilerData message. Does not implicitly {@link SphCpuProfilerData.verify|verify} messages.
     * @function encode
     * @memberof SphCpuProfilerData
     * @static
     * @param {ISphCpuProfilerData} message SphCpuProfilerData message or plain object to encode
     * @param {$protobuf.Writer} [writer] Writer to encode to
     * @returns {$protobuf.Writer} Writer
     */
    SphCpuProfilerData.encode = function encode(message, writer) {
        if (!writer)
            writer = $Writer.create();
        if (message.id != null && Object.hasOwnProperty.call(message, "id"))
            writer.uint32(/* id 1, wireType 0 =*/8).int64(message.id);
        if (message.functionId != null && Object.hasOwnProperty.call(message, "functionId"))
            writer.uint32(/* id 2, wireType 0 =*/16).int64(message.functionId);
        if (message.startTime != null && Object.hasOwnProperty.call(message, "startTime"))
            writer.uint32(/* id 3, wireType 0 =*/24).int64(message.startTime);
        if (message.endTime != null && Object.hasOwnProperty.call(message, "endTime"))
            writer.uint32(/* id 4, wireType 0 =*/32).int64(message.endTime);
        if (message.dur != null && Object.hasOwnProperty.call(message, "dur"))
            writer.uint32(/* id 5, wireType 0 =*/40).int64(message.dur);
        if (message.nameId != null && Object.hasOwnProperty.call(message, "nameId"))
            writer.uint32(/* id 6, wireType 0 =*/48).int64(message.nameId);
        if (message.urlId != null && Object.hasOwnProperty.call(message, "urlId"))
            writer.uint32(/* id 7, wireType 0 =*/56).int64(message.urlId);
        if (message.line != null && Object.hasOwnProperty.call(message, "line"))
            writer.uint32(/* id 8, wireType 0 =*/64).int64(message.line);
        if (message.column != null && Object.hasOwnProperty.call(message, "column"))
            writer.uint32(/* id 9, wireType 0 =*/72).int64(message.column);
        if (message.hitCount != null && Object.hasOwnProperty.call(message, "hitCount"))
            writer.uint32(/* id 10, wireType 0 =*/80).int64(message.hitCount);
        if (message.childrenString != null && Object.hasOwnProperty.call(message, "childrenString"))
            writer.uint32(/* id 11, wireType 0 =*/88).int64(message.childrenString);
        if (message.parentId != null && Object.hasOwnProperty.call(message, "parentId"))
            writer.uint32(/* id 12, wireType 0 =*/96).int64(message.parentId);
        return writer;
    };

    /**
     * Encodes the specified SphCpuProfilerData message, length delimited. Does not implicitly {@link SphCpuProfilerData.verify|verify} messages.
     * @function encodeDelimited
     * @memberof SphCpuProfilerData
     * @static
     * @param {ISphCpuProfilerData} message SphCpuProfilerData message or plain object to encode
     * @param {$protobuf.Writer} [writer] Writer to encode to
     * @returns {$protobuf.Writer} Writer
     */
    SphCpuProfilerData.encodeDelimited = function encodeDelimited(message, writer) {
        return this.encode(message, writer).ldelim();
    };

    /**
     * Decodes a SphCpuProfilerData message from the specified reader or buffer.
     * @function decode
     * @memberof SphCpuProfilerData
     * @static
     * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
     * @param {number} [length] Message length if known beforehand
     * @returns {SphCpuProfilerData} SphCpuProfilerData
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    SphCpuProfilerData.decode = function decode(reader, length) {
        if (!(reader instanceof $Reader))
            reader = $Reader.create(reader);
        var end = length === undefined ? reader.len : reader.pos + length, message = new $root.SphCpuProfilerData();
        while (reader.pos < end) {
            var tag = reader.uint32();
            switch (tag >>> 3) {
            case 1: {
                    message.id = reader.int64();
                    break;
                }
            case 2: {
                    message.functionId = reader.int64();
                    break;
                }
            case 3: {
                    message.startTime = reader.int64();
                    break;
                }
            case 4: {
                    message.endTime = reader.int64();
                    break;
                }
            case 5: {
                    message.dur = reader.int64();
                    break;
                }
            case 6: {
                    message.nameId = reader.int64();
                    break;
                }
            case 7: {
                    message.urlId = reader.int64();
                    break;
                }
            case 8: {
                    message.line = reader.int64();
                    break;
                }
            case 9: {
                    message.column = reader.int64();
                    break;
                }
            case 10: {
                    message.hitCount = reader.int64();
                    break;
                }
            case 11: {
                    message.childrenString = reader.int64();
                    break;
                }
            case 12: {
                    message.parentId = reader.int64();
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
     * Decodes a SphCpuProfilerData message from the specified reader or buffer, length delimited.
     * @function decodeDelimited
     * @memberof SphCpuProfilerData
     * @static
     * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
     * @returns {SphCpuProfilerData} SphCpuProfilerData
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    SphCpuProfilerData.decodeDelimited = function decodeDelimited(reader) {
        if (!(reader instanceof $Reader))
            reader = new $Reader(reader);
        return this.decode(reader, reader.uint32());
    };

    /**
     * Verifies a SphCpuProfilerData message.
     * @function verify
     * @memberof SphCpuProfilerData
     * @static
     * @param {Object.<string,*>} message Plain object to verify
     * @returns {string|null} `null` if valid, otherwise the reason why it is not
     */
    SphCpuProfilerData.verify = function verify(message) {
        if (typeof message !== "object" || message === null)
            return "object expected";
        if (message.id != null && message.hasOwnProperty("id"))
            if (!$util.isInteger(message.id) && !(message.id && $util.isInteger(message.id.low) && $util.isInteger(message.id.high)))
                return "id: integer|Long expected";
        if (message.functionId != null && message.hasOwnProperty("functionId"))
            if (!$util.isInteger(message.functionId) && !(message.functionId && $util.isInteger(message.functionId.low) && $util.isInteger(message.functionId.high)))
                return "functionId: integer|Long expected";
        if (message.startTime != null && message.hasOwnProperty("startTime"))
            if (!$util.isInteger(message.startTime) && !(message.startTime && $util.isInteger(message.startTime.low) && $util.isInteger(message.startTime.high)))
                return "startTime: integer|Long expected";
        if (message.endTime != null && message.hasOwnProperty("endTime"))
            if (!$util.isInteger(message.endTime) && !(message.endTime && $util.isInteger(message.endTime.low) && $util.isInteger(message.endTime.high)))
                return "endTime: integer|Long expected";
        if (message.dur != null && message.hasOwnProperty("dur"))
            if (!$util.isInteger(message.dur) && !(message.dur && $util.isInteger(message.dur.low) && $util.isInteger(message.dur.high)))
                return "dur: integer|Long expected";
        if (message.nameId != null && message.hasOwnProperty("nameId"))
            if (!$util.isInteger(message.nameId) && !(message.nameId && $util.isInteger(message.nameId.low) && $util.isInteger(message.nameId.high)))
                return "nameId: integer|Long expected";
        if (message.urlId != null && message.hasOwnProperty("urlId"))
            if (!$util.isInteger(message.urlId) && !(message.urlId && $util.isInteger(message.urlId.low) && $util.isInteger(message.urlId.high)))
                return "urlId: integer|Long expected";
        if (message.line != null && message.hasOwnProperty("line"))
            if (!$util.isInteger(message.line) && !(message.line && $util.isInteger(message.line.low) && $util.isInteger(message.line.high)))
                return "line: integer|Long expected";
        if (message.column != null && message.hasOwnProperty("column"))
            if (!$util.isInteger(message.column) && !(message.column && $util.isInteger(message.column.low) && $util.isInteger(message.column.high)))
                return "column: integer|Long expected";
        if (message.hitCount != null && message.hasOwnProperty("hitCount"))
            if (!$util.isInteger(message.hitCount) && !(message.hitCount && $util.isInteger(message.hitCount.low) && $util.isInteger(message.hitCount.high)))
                return "hitCount: integer|Long expected";
        if (message.childrenString != null && message.hasOwnProperty("childrenString"))
            if (!$util.isInteger(message.childrenString) && !(message.childrenString && $util.isInteger(message.childrenString.low) && $util.isInteger(message.childrenString.high)))
                return "childrenString: integer|Long expected";
        if (message.parentId != null && message.hasOwnProperty("parentId"))
            if (!$util.isInteger(message.parentId) && !(message.parentId && $util.isInteger(message.parentId.low) && $util.isInteger(message.parentId.high)))
                return "parentId: integer|Long expected";
        return null;
    };

    /**
     * Creates a SphCpuProfilerData message from a plain object. Also converts values to their respective internal types.
     * @function fromObject
     * @memberof SphCpuProfilerData
     * @static
     * @param {Object.<string,*>} object Plain object
     * @returns {SphCpuProfilerData} SphCpuProfilerData
     */
    SphCpuProfilerData.fromObject = function fromObject(object) {
        if (object instanceof $root.SphCpuProfilerData)
            return object;
        var message = new $root.SphCpuProfilerData();
        if (object.id != null)
            if ($util.Long)
                (message.id = $util.Long.fromValue(object.id)).unsigned = false;
            else if (typeof object.id === "string")
                message.id = parseInt(object.id, 10);
            else if (typeof object.id === "number")
                message.id = object.id;
            else if (typeof object.id === "object")
                message.id = new $util.LongBits(object.id.low >>> 0, object.id.high >>> 0).toNumber();
        if (object.functionId != null)
            if ($util.Long)
                (message.functionId = $util.Long.fromValue(object.functionId)).unsigned = false;
            else if (typeof object.functionId === "string")
                message.functionId = parseInt(object.functionId, 10);
            else if (typeof object.functionId === "number")
                message.functionId = object.functionId;
            else if (typeof object.functionId === "object")
                message.functionId = new $util.LongBits(object.functionId.low >>> 0, object.functionId.high >>> 0).toNumber();
        if (object.startTime != null)
            if ($util.Long)
                (message.startTime = $util.Long.fromValue(object.startTime)).unsigned = false;
            else if (typeof object.startTime === "string")
                message.startTime = parseInt(object.startTime, 10);
            else if (typeof object.startTime === "number")
                message.startTime = object.startTime;
            else if (typeof object.startTime === "object")
                message.startTime = new $util.LongBits(object.startTime.low >>> 0, object.startTime.high >>> 0).toNumber();
        if (object.endTime != null)
            if ($util.Long)
                (message.endTime = $util.Long.fromValue(object.endTime)).unsigned = false;
            else if (typeof object.endTime === "string")
                message.endTime = parseInt(object.endTime, 10);
            else if (typeof object.endTime === "number")
                message.endTime = object.endTime;
            else if (typeof object.endTime === "object")
                message.endTime = new $util.LongBits(object.endTime.low >>> 0, object.endTime.high >>> 0).toNumber();
        if (object.dur != null)
            if ($util.Long)
                (message.dur = $util.Long.fromValue(object.dur)).unsigned = false;
            else if (typeof object.dur === "string")
                message.dur = parseInt(object.dur, 10);
            else if (typeof object.dur === "number")
                message.dur = object.dur;
            else if (typeof object.dur === "object")
                message.dur = new $util.LongBits(object.dur.low >>> 0, object.dur.high >>> 0).toNumber();
        if (object.nameId != null)
            if ($util.Long)
                (message.nameId = $util.Long.fromValue(object.nameId)).unsigned = false;
            else if (typeof object.nameId === "string")
                message.nameId = parseInt(object.nameId, 10);
            else if (typeof object.nameId === "number")
                message.nameId = object.nameId;
            else if (typeof object.nameId === "object")
                message.nameId = new $util.LongBits(object.nameId.low >>> 0, object.nameId.high >>> 0).toNumber();
        if (object.urlId != null)
            if ($util.Long)
                (message.urlId = $util.Long.fromValue(object.urlId)).unsigned = false;
            else if (typeof object.urlId === "string")
                message.urlId = parseInt(object.urlId, 10);
            else if (typeof object.urlId === "number")
                message.urlId = object.urlId;
            else if (typeof object.urlId === "object")
                message.urlId = new $util.LongBits(object.urlId.low >>> 0, object.urlId.high >>> 0).toNumber();
        if (object.line != null)
            if ($util.Long)
                (message.line = $util.Long.fromValue(object.line)).unsigned = false;
            else if (typeof object.line === "string")
                message.line = parseInt(object.line, 10);
            else if (typeof object.line === "number")
                message.line = object.line;
            else if (typeof object.line === "object")
                message.line = new $util.LongBits(object.line.low >>> 0, object.line.high >>> 0).toNumber();
        if (object.column != null)
            if ($util.Long)
                (message.column = $util.Long.fromValue(object.column)).unsigned = false;
            else if (typeof object.column === "string")
                message.column = parseInt(object.column, 10);
            else if (typeof object.column === "number")
                message.column = object.column;
            else if (typeof object.column === "object")
                message.column = new $util.LongBits(object.column.low >>> 0, object.column.high >>> 0).toNumber();
        if (object.hitCount != null)
            if ($util.Long)
                (message.hitCount = $util.Long.fromValue(object.hitCount)).unsigned = false;
            else if (typeof object.hitCount === "string")
                message.hitCount = parseInt(object.hitCount, 10);
            else if (typeof object.hitCount === "number")
                message.hitCount = object.hitCount;
            else if (typeof object.hitCount === "object")
                message.hitCount = new $util.LongBits(object.hitCount.low >>> 0, object.hitCount.high >>> 0).toNumber();
        if (object.childrenString != null)
            if ($util.Long)
                (message.childrenString = $util.Long.fromValue(object.childrenString)).unsigned = false;
            else if (typeof object.childrenString === "string")
                message.childrenString = parseInt(object.childrenString, 10);
            else if (typeof object.childrenString === "number")
                message.childrenString = object.childrenString;
            else if (typeof object.childrenString === "object")
                message.childrenString = new $util.LongBits(object.childrenString.low >>> 0, object.childrenString.high >>> 0).toNumber();
        if (object.parentId != null)
            if ($util.Long)
                (message.parentId = $util.Long.fromValue(object.parentId)).unsigned = false;
            else if (typeof object.parentId === "string")
                message.parentId = parseInt(object.parentId, 10);
            else if (typeof object.parentId === "number")
                message.parentId = object.parentId;
            else if (typeof object.parentId === "object")
                message.parentId = new $util.LongBits(object.parentId.low >>> 0, object.parentId.high >>> 0).toNumber();
        return message;
    };

    /**
     * Creates a plain object from a SphCpuProfilerData message. Also converts values to other types if specified.
     * @function toObject
     * @memberof SphCpuProfilerData
     * @static
     * @param {SphCpuProfilerData} message SphCpuProfilerData
     * @param {$protobuf.IConversionOptions} [options] Conversion options
     * @returns {Object.<string,*>} Plain object
     */
    SphCpuProfilerData.toObject = function toObject(message, options) {
        if (!options)
            options = {};
        var object = {};
        if (options.defaults) {
            if ($util.Long) {
                var long = new $util.Long(0, 0, false);
                object.id = options.longs === String ? long.toString() : options.longs === Number ? long.toNumber() : long;
            } else
                object.id = options.longs === String ? "0" : 0;
            if ($util.Long) {
                var long = new $util.Long(0, 0, false);
                object.functionId = options.longs === String ? long.toString() : options.longs === Number ? long.toNumber() : long;
            } else
                object.functionId = options.longs === String ? "0" : 0;
            if ($util.Long) {
                var long = new $util.Long(0, 0, false);
                object.startTime = options.longs === String ? long.toString() : options.longs === Number ? long.toNumber() : long;
            } else
                object.startTime = options.longs === String ? "0" : 0;
            if ($util.Long) {
                var long = new $util.Long(0, 0, false);
                object.endTime = options.longs === String ? long.toString() : options.longs === Number ? long.toNumber() : long;
            } else
                object.endTime = options.longs === String ? "0" : 0;
            if ($util.Long) {
                var long = new $util.Long(0, 0, false);
                object.dur = options.longs === String ? long.toString() : options.longs === Number ? long.toNumber() : long;
            } else
                object.dur = options.longs === String ? "0" : 0;
            if ($util.Long) {
                var long = new $util.Long(0, 0, false);
                object.nameId = options.longs === String ? long.toString() : options.longs === Number ? long.toNumber() : long;
            } else
                object.nameId = options.longs === String ? "0" : 0;
            if ($util.Long) {
                var long = new $util.Long(0, 0, false);
                object.urlId = options.longs === String ? long.toString() : options.longs === Number ? long.toNumber() : long;
            } else
                object.urlId = options.longs === String ? "0" : 0;
            if ($util.Long) {
                var long = new $util.Long(0, 0, false);
                object.line = options.longs === String ? long.toString() : options.longs === Number ? long.toNumber() : long;
            } else
                object.line = options.longs === String ? "0" : 0;
            if ($util.Long) {
                var long = new $util.Long(0, 0, false);
                object.column = options.longs === String ? long.toString() : options.longs === Number ? long.toNumber() : long;
            } else
                object.column = options.longs === String ? "0" : 0;
            if ($util.Long) {
                var long = new $util.Long(0, 0, false);
                object.hitCount = options.longs === String ? long.toString() : options.longs === Number ? long.toNumber() : long;
            } else
                object.hitCount = options.longs === String ? "0" : 0;
            if ($util.Long) {
                var long = new $util.Long(0, 0, false);
                object.childrenString = options.longs === String ? long.toString() : options.longs === Number ? long.toNumber() : long;
            } else
                object.childrenString = options.longs === String ? "0" : 0;
            if ($util.Long) {
                var long = new $util.Long(0, 0, false);
                object.parentId = options.longs === String ? long.toString() : options.longs === Number ? long.toNumber() : long;
            } else
                object.parentId = options.longs === String ? "0" : 0;
        }
        if (message.id != null && message.hasOwnProperty("id"))
            if (typeof message.id === "number")
                object.id = options.longs === String ? String(message.id) : message.id;
            else
                object.id = options.longs === String ? $util.Long.prototype.toString.call(message.id) : options.longs === Number ? new $util.LongBits(message.id.low >>> 0, message.id.high >>> 0).toNumber() : message.id;
        if (message.functionId != null && message.hasOwnProperty("functionId"))
            if (typeof message.functionId === "number")
                object.functionId = options.longs === String ? String(message.functionId) : message.functionId;
            else
                object.functionId = options.longs === String ? $util.Long.prototype.toString.call(message.functionId) : options.longs === Number ? new $util.LongBits(message.functionId.low >>> 0, message.functionId.high >>> 0).toNumber() : message.functionId;
        if (message.startTime != null && message.hasOwnProperty("startTime"))
            if (typeof message.startTime === "number")
                object.startTime = options.longs === String ? String(message.startTime) : message.startTime;
            else
                object.startTime = options.longs === String ? $util.Long.prototype.toString.call(message.startTime) : options.longs === Number ? new $util.LongBits(message.startTime.low >>> 0, message.startTime.high >>> 0).toNumber() : message.startTime;
        if (message.endTime != null && message.hasOwnProperty("endTime"))
            if (typeof message.endTime === "number")
                object.endTime = options.longs === String ? String(message.endTime) : message.endTime;
            else
                object.endTime = options.longs === String ? $util.Long.prototype.toString.call(message.endTime) : options.longs === Number ? new $util.LongBits(message.endTime.low >>> 0, message.endTime.high >>> 0).toNumber() : message.endTime;
        if (message.dur != null && message.hasOwnProperty("dur"))
            if (typeof message.dur === "number")
                object.dur = options.longs === String ? String(message.dur) : message.dur;
            else
                object.dur = options.longs === String ? $util.Long.prototype.toString.call(message.dur) : options.longs === Number ? new $util.LongBits(message.dur.low >>> 0, message.dur.high >>> 0).toNumber() : message.dur;
        if (message.nameId != null && message.hasOwnProperty("nameId"))
            if (typeof message.nameId === "number")
                object.nameId = options.longs === String ? String(message.nameId) : message.nameId;
            else
                object.nameId = options.longs === String ? $util.Long.prototype.toString.call(message.nameId) : options.longs === Number ? new $util.LongBits(message.nameId.low >>> 0, message.nameId.high >>> 0).toNumber() : message.nameId;
        if (message.urlId != null && message.hasOwnProperty("urlId"))
            if (typeof message.urlId === "number")
                object.urlId = options.longs === String ? String(message.urlId) : message.urlId;
            else
                object.urlId = options.longs === String ? $util.Long.prototype.toString.call(message.urlId) : options.longs === Number ? new $util.LongBits(message.urlId.low >>> 0, message.urlId.high >>> 0).toNumber() : message.urlId;
        if (message.line != null && message.hasOwnProperty("line"))
            if (typeof message.line === "number")
                object.line = options.longs === String ? String(message.line) : message.line;
            else
                object.line = options.longs === String ? $util.Long.prototype.toString.call(message.line) : options.longs === Number ? new $util.LongBits(message.line.low >>> 0, message.line.high >>> 0).toNumber() : message.line;
        if (message.column != null && message.hasOwnProperty("column"))
            if (typeof message.column === "number")
                object.column = options.longs === String ? String(message.column) : message.column;
            else
                object.column = options.longs === String ? $util.Long.prototype.toString.call(message.column) : options.longs === Number ? new $util.LongBits(message.column.low >>> 0, message.column.high >>> 0).toNumber() : message.column;
        if (message.hitCount != null && message.hasOwnProperty("hitCount"))
            if (typeof message.hitCount === "number")
                object.hitCount = options.longs === String ? String(message.hitCount) : message.hitCount;
            else
                object.hitCount = options.longs === String ? $util.Long.prototype.toString.call(message.hitCount) : options.longs === Number ? new $util.LongBits(message.hitCount.low >>> 0, message.hitCount.high >>> 0).toNumber() : message.hitCount;
        if (message.childrenString != null && message.hasOwnProperty("childrenString"))
            if (typeof message.childrenString === "number")
                object.childrenString = options.longs === String ? String(message.childrenString) : message.childrenString;
            else
                object.childrenString = options.longs === String ? $util.Long.prototype.toString.call(message.childrenString) : options.longs === Number ? new $util.LongBits(message.childrenString.low >>> 0, message.childrenString.high >>> 0).toNumber() : message.childrenString;
        if (message.parentId != null && message.hasOwnProperty("parentId"))
            if (typeof message.parentId === "number")
                object.parentId = options.longs === String ? String(message.parentId) : message.parentId;
            else
                object.parentId = options.longs === String ? $util.Long.prototype.toString.call(message.parentId) : options.longs === Number ? new $util.LongBits(message.parentId.low >>> 0, message.parentId.high >>> 0).toNumber() : message.parentId;
        return object;
    };

    /**
     * Converts this SphCpuProfilerData to JSON.
     * @function toJSON
     * @memberof SphCpuProfilerData
     * @instance
     * @returns {Object.<string,*>} JSON object
     */
    SphCpuProfilerData.prototype.toJSON = function toJSON() {
        return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
    };

    /**
     * Gets the default type url for SphCpuProfilerData
     * @function getTypeUrl
     * @memberof SphCpuProfilerData
     * @static
     * @param {string} [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
     * @returns {string} The default type url
     */
    SphCpuProfilerData.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
        if (typeUrlPrefix === undefined) {
            typeUrlPrefix = "type.googleapis.com";
        }
        return typeUrlPrefix + "/SphCpuProfilerData";
    };

    return SphCpuProfilerData;
})();

$root.SphCpuAbilityData = (function() {

    /**
     * Properties of a SphCpuAbilityData.
     * @exports ISphCpuAbilityData
     * @interface ISphCpuAbilityData
     * @property {string|null} [value] SphCpuAbilityData value
     * @property {number|Long|null} [startNs] SphCpuAbilityData startNs
     * @property {number|null} [dur] SphCpuAbilityData dur
     */

    /**
     * Constructs a new SphCpuAbilityData.
     * @exports SphCpuAbilityData
     * @classdesc Represents a SphCpuAbilityData.
     * @implements ISphCpuAbilityData
     * @constructor
     * @param {ISphCpuAbilityData=} [properties] Properties to set
     */
    function SphCpuAbilityData(properties) {
        if (properties)
            for (var keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                if (properties[keys[i]] != null)
                    this[keys[i]] = properties[keys[i]];
    }

    /**
     * SphCpuAbilityData value.
     * @member {string} value
     * @memberof SphCpuAbilityData
     * @instance
     */
    SphCpuAbilityData.prototype.value = "";

    /**
     * SphCpuAbilityData startNs.
     * @member {number|Long} startNs
     * @memberof SphCpuAbilityData
     * @instance
     */
    SphCpuAbilityData.prototype.startNs = $util.Long ? $util.Long.fromBits(0,0,false) : 0;

    /**
     * SphCpuAbilityData dur.
     * @member {number} dur
     * @memberof SphCpuAbilityData
     * @instance
     */
    SphCpuAbilityData.prototype.dur = 0;

    /**
     * Creates a new SphCpuAbilityData instance using the specified properties.
     * @function create
     * @memberof SphCpuAbilityData
     * @static
     * @param {ISphCpuAbilityData=} [properties] Properties to set
     * @returns {SphCpuAbilityData} SphCpuAbilityData instance
     */
    SphCpuAbilityData.create = function create(properties) {
        return new SphCpuAbilityData(properties);
    };

    /**
     * Encodes the specified SphCpuAbilityData message. Does not implicitly {@link SphCpuAbilityData.verify|verify} messages.
     * @function encode
     * @memberof SphCpuAbilityData
     * @static
     * @param {ISphCpuAbilityData} message SphCpuAbilityData message or plain object to encode
     * @param {$protobuf.Writer} [writer] Writer to encode to
     * @returns {$protobuf.Writer} Writer
     */
    SphCpuAbilityData.encode = function encode(message, writer) {
        if (!writer)
            writer = $Writer.create();
        if (message.value != null && Object.hasOwnProperty.call(message, "value"))
            writer.uint32(/* id 1, wireType 2 =*/10).string(message.value);
        if (message.startNs != null && Object.hasOwnProperty.call(message, "startNs"))
            writer.uint32(/* id 2, wireType 0 =*/16).int64(message.startNs);
        if (message.dur != null && Object.hasOwnProperty.call(message, "dur"))
            writer.uint32(/* id 3, wireType 0 =*/24).int32(message.dur);
        return writer;
    };

    /**
     * Encodes the specified SphCpuAbilityData message, length delimited. Does not implicitly {@link SphCpuAbilityData.verify|verify} messages.
     * @function encodeDelimited
     * @memberof SphCpuAbilityData
     * @static
     * @param {ISphCpuAbilityData} message SphCpuAbilityData message or plain object to encode
     * @param {$protobuf.Writer} [writer] Writer to encode to
     * @returns {$protobuf.Writer} Writer
     */
    SphCpuAbilityData.encodeDelimited = function encodeDelimited(message, writer) {
        return this.encode(message, writer).ldelim();
    };

    /**
     * Decodes a SphCpuAbilityData message from the specified reader or buffer.
     * @function decode
     * @memberof SphCpuAbilityData
     * @static
     * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
     * @param {number} [length] Message length if known beforehand
     * @returns {SphCpuAbilityData} SphCpuAbilityData
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    SphCpuAbilityData.decode = function decode(reader, length) {
        if (!(reader instanceof $Reader))
            reader = $Reader.create(reader);
        var end = length === undefined ? reader.len : reader.pos + length, message = new $root.SphCpuAbilityData();
        while (reader.pos < end) {
            var tag = reader.uint32();
            switch (tag >>> 3) {
            case 1: {
                    message.value = reader.string();
                    break;
                }
            case 2: {
                    message.startNs = reader.int64();
                    break;
                }
            case 3: {
                    message.dur = reader.int32();
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
     * Decodes a SphCpuAbilityData message from the specified reader or buffer, length delimited.
     * @function decodeDelimited
     * @memberof SphCpuAbilityData
     * @static
     * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
     * @returns {SphCpuAbilityData} SphCpuAbilityData
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    SphCpuAbilityData.decodeDelimited = function decodeDelimited(reader) {
        if (!(reader instanceof $Reader))
            reader = new $Reader(reader);
        return this.decode(reader, reader.uint32());
    };

    /**
     * Verifies a SphCpuAbilityData message.
     * @function verify
     * @memberof SphCpuAbilityData
     * @static
     * @param {Object.<string,*>} message Plain object to verify
     * @returns {string|null} `null` if valid, otherwise the reason why it is not
     */
    SphCpuAbilityData.verify = function verify(message) {
        if (typeof message !== "object" || message === null)
            return "object expected";
        if (message.value != null && message.hasOwnProperty("value"))
            if (!$util.isString(message.value))
                return "value: string expected";
        if (message.startNs != null && message.hasOwnProperty("startNs"))
            if (!$util.isInteger(message.startNs) && !(message.startNs && $util.isInteger(message.startNs.low) && $util.isInteger(message.startNs.high)))
                return "startNs: integer|Long expected";
        if (message.dur != null && message.hasOwnProperty("dur"))
            if (!$util.isInteger(message.dur))
                return "dur: integer expected";
        return null;
    };

    /**
     * Creates a SphCpuAbilityData message from a plain object. Also converts values to their respective internal types.
     * @function fromObject
     * @memberof SphCpuAbilityData
     * @static
     * @param {Object.<string,*>} object Plain object
     * @returns {SphCpuAbilityData} SphCpuAbilityData
     */
    SphCpuAbilityData.fromObject = function fromObject(object) {
        if (object instanceof $root.SphCpuAbilityData)
            return object;
        var message = new $root.SphCpuAbilityData();
        if (object.value != null)
            message.value = String(object.value);
        if (object.startNs != null)
            if ($util.Long)
                (message.startNs = $util.Long.fromValue(object.startNs)).unsigned = false;
            else if (typeof object.startNs === "string")
                message.startNs = parseInt(object.startNs, 10);
            else if (typeof object.startNs === "number")
                message.startNs = object.startNs;
            else if (typeof object.startNs === "object")
                message.startNs = new $util.LongBits(object.startNs.low >>> 0, object.startNs.high >>> 0).toNumber();
        if (object.dur != null)
            message.dur = object.dur | 0;
        return message;
    };

    /**
     * Creates a plain object from a SphCpuAbilityData message. Also converts values to other types if specified.
     * @function toObject
     * @memberof SphCpuAbilityData
     * @static
     * @param {SphCpuAbilityData} message SphCpuAbilityData
     * @param {$protobuf.IConversionOptions} [options] Conversion options
     * @returns {Object.<string,*>} Plain object
     */
    SphCpuAbilityData.toObject = function toObject(message, options) {
        if (!options)
            options = {};
        var object = {};
        if (options.defaults) {
            object.value = "";
            if ($util.Long) {
                var long = new $util.Long(0, 0, false);
                object.startNs = options.longs === String ? long.toString() : options.longs === Number ? long.toNumber() : long;
            } else
                object.startNs = options.longs === String ? "0" : 0;
            object.dur = 0;
        }
        if (message.value != null && message.hasOwnProperty("value"))
            object.value = message.value;
        if (message.startNs != null && message.hasOwnProperty("startNs"))
            if (typeof message.startNs === "number")
                object.startNs = options.longs === String ? String(message.startNs) : message.startNs;
            else
                object.startNs = options.longs === String ? $util.Long.prototype.toString.call(message.startNs) : options.longs === Number ? new $util.LongBits(message.startNs.low >>> 0, message.startNs.high >>> 0).toNumber() : message.startNs;
        if (message.dur != null && message.hasOwnProperty("dur"))
            object.dur = message.dur;
        return object;
    };

    /**
     * Converts this SphCpuAbilityData to JSON.
     * @function toJSON
     * @memberof SphCpuAbilityData
     * @instance
     * @returns {Object.<string,*>} JSON object
     */
    SphCpuAbilityData.prototype.toJSON = function toJSON() {
        return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
    };

    /**
     * Gets the default type url for SphCpuAbilityData
     * @function getTypeUrl
     * @memberof SphCpuAbilityData
     * @static
     * @param {string} [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
     * @returns {string} The default type url
     */
    SphCpuAbilityData.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
        if (typeUrlPrefix === undefined) {
            typeUrlPrefix = "type.googleapis.com";
        }
        return typeUrlPrefix + "/SphCpuAbilityData";
    };

    return SphCpuAbilityData;
})();

$root.SphData = (function() {

    /**
     * Properties of a SphData.
     * @exports ISphData
     * @interface ISphData
     * @property {ISphCpuData|null} [cpuData] SphData cpuData
     * @property {ISphCpuStateData|null} [cpuStateData] SphData cpuStateData
     * @property {ISphCpuFreqData|null} [cpuFreqData] SphData cpuFreqData
     * @property {ISphCpuFreqLimitData|null} [cpuFreqLimitData] SphData cpuFreqLimitData
     * @property {ISphClockData|null} [clockData] SphData clockData
     * @property {ISphIrqData|null} [irqData] SphData irqData
     * @property {ISphProcessData|null} [processData] SphData processData
     * @property {ISphProcessMemData|null} [processMemData] SphData processMemData
     * @property {ISphProcessStartupData|null} [processStartupData] SphData processStartupData
     * @property {ISphProcessSoInitData|null} [processSoInitData] SphData processSoInitData
     * @property {ISphHiSysEventData|null} [hiSysEventData] SphData hiSysEventData
     * @property {ISphLogData|null} [logData] SphData logData
     * @property {ISphVirtualMemData|null} [virtualMemData] SphData virtualMemData
     * @property {ISphEnergyData|null} [energyData] SphData energyData
     * @property {ISphFrameData|null} [frameData] SphData frameData
     * @property {ISphFrameAnimationData|null} [frameAnimationData] SphData frameAnimationData
     * @property {ISphFrameDynamicData|null} [frameDynamicData] SphData frameDynamicData
     * @property {ISphFrameSpacingData|null} [frameSpacingData] SphData frameSpacingData
     * @property {ISphEbpfData|null} [ebpfData] SphData ebpfData
     * @property {ISphTrackerData|null} [trackerData] SphData trackerData
     * @property {ISphAbilityData|null} [abilityData] SphData abilityData
     * @property {ISphProcessThreadData|null} [processThreadData] SphData processThreadData
     * @property {ISphProcessFuncData|null} [processFuncData] SphData processFuncData
     * @property {ISphHiperfData|null} [hiperfData] SphData hiperfData
     * @property {ISphHiperfCallChartData|null} [hiperfCallChartData] SphData hiperfCallChartData
     * @property {ISphHiperfCallStackData|null} [hiperfCallStackData] SphData hiperfCallStackData
     * @property {ISphProcessJanksFramesData|null} [processJanksFramesData] SphData processJanksFramesData
     * @property {ISphProcessJanksActualData|null} [processJanksActualData] SphData processJanksActualData
     * @property {ISphProcessInputEventData|null} [processInputEventData] SphData processInputEventData
     * @property {ISphHeapFilesData|null} [heapFilesData] SphData heapFilesData
     * @property {ISphCpuProfilerData|null} [cpuProfilerData] SphData cpuProfilerData
     * @property {ISphNativeMemoryNormalData|null} [nativeMemoryNormal] SphData nativeMemoryNormal
     * @property {ISphNativeMemoryStatisticData|null} [nativeMemoryStatistic] SphData nativeMemoryStatistic
     * @property {ISphCpuAbilityData|null} [cpuAbilityData] SphData cpuAbilityData
     */

    /**
     * Constructs a new SphData.
     * @exports SphData
     * @classdesc Represents a SphData.
     * @implements ISphData
     * @constructor
     * @param {ISphData=} [properties] Properties to set
     */
    function SphData(properties) {
        if (properties)
            for (var keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                if (properties[keys[i]] != null)
                    this[keys[i]] = properties[keys[i]];
    }

    /**
     * SphData cpuData.
     * @member {ISphCpuData|null|undefined} cpuData
     * @memberof SphData
     * @instance
     */
    SphData.prototype.cpuData = null;

    /**
     * SphData cpuStateData.
     * @member {ISphCpuStateData|null|undefined} cpuStateData
     * @memberof SphData
     * @instance
     */
    SphData.prototype.cpuStateData = null;

    /**
     * SphData cpuFreqData.
     * @member {ISphCpuFreqData|null|undefined} cpuFreqData
     * @memberof SphData
     * @instance
     */
    SphData.prototype.cpuFreqData = null;

    /**
     * SphData cpuFreqLimitData.
     * @member {ISphCpuFreqLimitData|null|undefined} cpuFreqLimitData
     * @memberof SphData
     * @instance
     */
    SphData.prototype.cpuFreqLimitData = null;

    /**
     * SphData clockData.
     * @member {ISphClockData|null|undefined} clockData
     * @memberof SphData
     * @instance
     */
    SphData.prototype.clockData = null;

    /**
     * SphData irqData.
     * @member {ISphIrqData|null|undefined} irqData
     * @memberof SphData
     * @instance
     */
    SphData.prototype.irqData = null;

    /**
     * SphData processData.
     * @member {ISphProcessData|null|undefined} processData
     * @memberof SphData
     * @instance
     */
    SphData.prototype.processData = null;

    /**
     * SphData processMemData.
     * @member {ISphProcessMemData|null|undefined} processMemData
     * @memberof SphData
     * @instance
     */
    SphData.prototype.processMemData = null;

    /**
     * SphData processStartupData.
     * @member {ISphProcessStartupData|null|undefined} processStartupData
     * @memberof SphData
     * @instance
     */
    SphData.prototype.processStartupData = null;

    /**
     * SphData processSoInitData.
     * @member {ISphProcessSoInitData|null|undefined} processSoInitData
     * @memberof SphData
     * @instance
     */
    SphData.prototype.processSoInitData = null;

    /**
     * SphData hiSysEventData.
     * @member {ISphHiSysEventData|null|undefined} hiSysEventData
     * @memberof SphData
     * @instance
     */
    SphData.prototype.hiSysEventData = null;

    /**
     * SphData logData.
     * @member {ISphLogData|null|undefined} logData
     * @memberof SphData
     * @instance
     */
    SphData.prototype.logData = null;

    /**
     * SphData virtualMemData.
     * @member {ISphVirtualMemData|null|undefined} virtualMemData
     * @memberof SphData
     * @instance
     */
    SphData.prototype.virtualMemData = null;

    /**
     * SphData energyData.
     * @member {ISphEnergyData|null|undefined} energyData
     * @memberof SphData
     * @instance
     */
    SphData.prototype.energyData = null;

    /**
     * SphData frameData.
     * @member {ISphFrameData|null|undefined} frameData
     * @memberof SphData
     * @instance
     */
    SphData.prototype.frameData = null;

    /**
     * SphData frameAnimationData.
     * @member {ISphFrameAnimationData|null|undefined} frameAnimationData
     * @memberof SphData
     * @instance
     */
    SphData.prototype.frameAnimationData = null;

    /**
     * SphData frameDynamicData.
     * @member {ISphFrameDynamicData|null|undefined} frameDynamicData
     * @memberof SphData
     * @instance
     */
    SphData.prototype.frameDynamicData = null;

    /**
     * SphData frameSpacingData.
     * @member {ISphFrameSpacingData|null|undefined} frameSpacingData
     * @memberof SphData
     * @instance
     */
    SphData.prototype.frameSpacingData = null;

    /**
     * SphData ebpfData.
     * @member {ISphEbpfData|null|undefined} ebpfData
     * @memberof SphData
     * @instance
     */
    SphData.prototype.ebpfData = null;

    /**
     * SphData trackerData.
     * @member {ISphTrackerData|null|undefined} trackerData
     * @memberof SphData
     * @instance
     */
    SphData.prototype.trackerData = null;

    /**
     * SphData abilityData.
     * @member {ISphAbilityData|null|undefined} abilityData
     * @memberof SphData
     * @instance
     */
    SphData.prototype.abilityData = null;

    /**
     * SphData processThreadData.
     * @member {ISphProcessThreadData|null|undefined} processThreadData
     * @memberof SphData
     * @instance
     */
    SphData.prototype.processThreadData = null;

    /**
     * SphData processFuncData.
     * @member {ISphProcessFuncData|null|undefined} processFuncData
     * @memberof SphData
     * @instance
     */
    SphData.prototype.processFuncData = null;

    /**
     * SphData hiperfData.
     * @member {ISphHiperfData|null|undefined} hiperfData
     * @memberof SphData
     * @instance
     */
    SphData.prototype.hiperfData = null;

    /**
     * SphData hiperfCallChartData.
     * @member {ISphHiperfCallChartData|null|undefined} hiperfCallChartData
     * @memberof SphData
     * @instance
     */
    SphData.prototype.hiperfCallChartData = null;

    /**
     * SphData hiperfCallStackData.
     * @member {ISphHiperfCallStackData|null|undefined} hiperfCallStackData
     * @memberof SphData
     * @instance
     */
    SphData.prototype.hiperfCallStackData = null;

    /**
     * SphData processJanksFramesData.
     * @member {ISphProcessJanksFramesData|null|undefined} processJanksFramesData
     * @memberof SphData
     * @instance
     */
    SphData.prototype.processJanksFramesData = null;

    /**
     * SphData processJanksActualData.
     * @member {ISphProcessJanksActualData|null|undefined} processJanksActualData
     * @memberof SphData
     * @instance
     */
    SphData.prototype.processJanksActualData = null;

    /**
     * SphData processInputEventData.
     * @member {ISphProcessInputEventData|null|undefined} processInputEventData
     * @memberof SphData
     * @instance
     */
    SphData.prototype.processInputEventData = null;

    /**
     * SphData heapFilesData.
     * @member {ISphHeapFilesData|null|undefined} heapFilesData
     * @memberof SphData
     * @instance
     */
    SphData.prototype.heapFilesData = null;

    /**
     * SphData cpuProfilerData.
     * @member {ISphCpuProfilerData|null|undefined} cpuProfilerData
     * @memberof SphData
     * @instance
     */
    SphData.prototype.cpuProfilerData = null;

    /**
     * SphData nativeMemoryNormal.
     * @member {ISphNativeMemoryNormalData|null|undefined} nativeMemoryNormal
     * @memberof SphData
     * @instance
     */
    SphData.prototype.nativeMemoryNormal = null;

    /**
     * SphData nativeMemoryStatistic.
     * @member {ISphNativeMemoryStatisticData|null|undefined} nativeMemoryStatistic
     * @memberof SphData
     * @instance
     */
    SphData.prototype.nativeMemoryStatistic = null;

    /**
     * SphData cpuAbilityData.
     * @member {ISphCpuAbilityData|null|undefined} cpuAbilityData
     * @memberof SphData
     * @instance
     */
    SphData.prototype.cpuAbilityData = null;

    // OneOf field names bound to virtual getters and setters
    var $oneOfFields;

    /**
     * SphData event.
     * @member {"cpuData"|"cpuStateData"|"cpuFreqData"|"cpuFreqLimitData"|"clockData"|"irqData"|"processData"|"processMemData"|"processStartupData"|"processSoInitData"|"hiSysEventData"|"logData"|"virtualMemData"|"energyData"|"frameData"|"frameAnimationData"|"frameDynamicData"|"frameSpacingData"|"ebpfData"|"trackerData"|"abilityData"|"processThreadData"|"processFuncData"|"hiperfData"|"hiperfCallChartData"|"hiperfCallStackData"|"processJanksFramesData"|"processJanksActualData"|"processInputEventData"|"heapFilesData"|"cpuProfilerData"|"nativeMemoryNormal"|"nativeMemoryStatistic"|"cpuAbilityData"|undefined} event
     * @memberof SphData
     * @instance
     */
    Object.defineProperty(SphData.prototype, "event", {
        get: $util.oneOfGetter($oneOfFields = ["cpuData", "cpuStateData", "cpuFreqData", "cpuFreqLimitData", "clockData", "irqData", "processData", "processMemData", "processStartupData", "processSoInitData", "hiSysEventData", "logData", "virtualMemData", "energyData", "frameData", "frameAnimationData", "frameDynamicData", "frameSpacingData", "ebpfData", "trackerData", "abilityData", "processThreadData", "processFuncData", "hiperfData", "hiperfCallChartData", "hiperfCallStackData", "processJanksFramesData", "processJanksActualData", "processInputEventData", "heapFilesData", "cpuProfilerData", "nativeMemoryNormal", "nativeMemoryStatistic", "cpuAbilityData"]),
        set: $util.oneOfSetter($oneOfFields)
    });

    /**
     * Creates a new SphData instance using the specified properties.
     * @function create
     * @memberof SphData
     * @static
     * @param {ISphData=} [properties] Properties to set
     * @returns {SphData} SphData instance
     */
    SphData.create = function create(properties) {
        return new SphData(properties);
    };

    /**
     * Encodes the specified SphData message. Does not implicitly {@link SphData.verify|verify} messages.
     * @function encode
     * @memberof SphData
     * @static
     * @param {ISphData} message SphData message or plain object to encode
     * @param {$protobuf.Writer} [writer] Writer to encode to
     * @returns {$protobuf.Writer} Writer
     */
    SphData.encode = function encode(message, writer) {
        if (!writer)
            writer = $Writer.create();
        if (message.cpuData != null && Object.hasOwnProperty.call(message, "cpuData"))
            $root.SphCpuData.encode(message.cpuData, writer.uint32(/* id 1, wireType 2 =*/10).fork()).ldelim();
        if (message.cpuStateData != null && Object.hasOwnProperty.call(message, "cpuStateData"))
            $root.SphCpuStateData.encode(message.cpuStateData, writer.uint32(/* id 2, wireType 2 =*/18).fork()).ldelim();
        if (message.cpuFreqData != null && Object.hasOwnProperty.call(message, "cpuFreqData"))
            $root.SphCpuFreqData.encode(message.cpuFreqData, writer.uint32(/* id 3, wireType 2 =*/26).fork()).ldelim();
        if (message.cpuFreqLimitData != null && Object.hasOwnProperty.call(message, "cpuFreqLimitData"))
            $root.SphCpuFreqLimitData.encode(message.cpuFreqLimitData, writer.uint32(/* id 4, wireType 2 =*/34).fork()).ldelim();
        if (message.clockData != null && Object.hasOwnProperty.call(message, "clockData"))
            $root.SphClockData.encode(message.clockData, writer.uint32(/* id 5, wireType 2 =*/42).fork()).ldelim();
        if (message.irqData != null && Object.hasOwnProperty.call(message, "irqData"))
            $root.SphIrqData.encode(message.irqData, writer.uint32(/* id 6, wireType 2 =*/50).fork()).ldelim();
        if (message.processData != null && Object.hasOwnProperty.call(message, "processData"))
            $root.SphProcessData.encode(message.processData, writer.uint32(/* id 7, wireType 2 =*/58).fork()).ldelim();
        if (message.processMemData != null && Object.hasOwnProperty.call(message, "processMemData"))
            $root.SphProcessMemData.encode(message.processMemData, writer.uint32(/* id 8, wireType 2 =*/66).fork()).ldelim();
        if (message.processStartupData != null && Object.hasOwnProperty.call(message, "processStartupData"))
            $root.SphProcessStartupData.encode(message.processStartupData, writer.uint32(/* id 9, wireType 2 =*/74).fork()).ldelim();
        if (message.processSoInitData != null && Object.hasOwnProperty.call(message, "processSoInitData"))
            $root.SphProcessSoInitData.encode(message.processSoInitData, writer.uint32(/* id 10, wireType 2 =*/82).fork()).ldelim();
        if (message.hiSysEventData != null && Object.hasOwnProperty.call(message, "hiSysEventData"))
            $root.SphHiSysEventData.encode(message.hiSysEventData, writer.uint32(/* id 11, wireType 2 =*/90).fork()).ldelim();
        if (message.logData != null && Object.hasOwnProperty.call(message, "logData"))
            $root.SphLogData.encode(message.logData, writer.uint32(/* id 12, wireType 2 =*/98).fork()).ldelim();
        if (message.virtualMemData != null && Object.hasOwnProperty.call(message, "virtualMemData"))
            $root.SphVirtualMemData.encode(message.virtualMemData, writer.uint32(/* id 13, wireType 2 =*/106).fork()).ldelim();
        if (message.energyData != null && Object.hasOwnProperty.call(message, "energyData"))
            $root.SphEnergyData.encode(message.energyData, writer.uint32(/* id 14, wireType 2 =*/114).fork()).ldelim();
        if (message.frameData != null && Object.hasOwnProperty.call(message, "frameData"))
            $root.SphFrameData.encode(message.frameData, writer.uint32(/* id 15, wireType 2 =*/122).fork()).ldelim();
        if (message.frameAnimationData != null && Object.hasOwnProperty.call(message, "frameAnimationData"))
            $root.SphFrameAnimationData.encode(message.frameAnimationData, writer.uint32(/* id 16, wireType 2 =*/130).fork()).ldelim();
        if (message.frameDynamicData != null && Object.hasOwnProperty.call(message, "frameDynamicData"))
            $root.SphFrameDynamicData.encode(message.frameDynamicData, writer.uint32(/* id 17, wireType 2 =*/138).fork()).ldelim();
        if (message.frameSpacingData != null && Object.hasOwnProperty.call(message, "frameSpacingData"))
            $root.SphFrameSpacingData.encode(message.frameSpacingData, writer.uint32(/* id 18, wireType 2 =*/146).fork()).ldelim();
        if (message.ebpfData != null && Object.hasOwnProperty.call(message, "ebpfData"))
            $root.SphEbpfData.encode(message.ebpfData, writer.uint32(/* id 19, wireType 2 =*/154).fork()).ldelim();
        if (message.trackerData != null && Object.hasOwnProperty.call(message, "trackerData"))
            $root.SphTrackerData.encode(message.trackerData, writer.uint32(/* id 20, wireType 2 =*/162).fork()).ldelim();
        if (message.abilityData != null && Object.hasOwnProperty.call(message, "abilityData"))
            $root.SphAbilityData.encode(message.abilityData, writer.uint32(/* id 21, wireType 2 =*/170).fork()).ldelim();
        if (message.processThreadData != null && Object.hasOwnProperty.call(message, "processThreadData"))
            $root.SphProcessThreadData.encode(message.processThreadData, writer.uint32(/* id 22, wireType 2 =*/178).fork()).ldelim();
        if (message.processFuncData != null && Object.hasOwnProperty.call(message, "processFuncData"))
            $root.SphProcessFuncData.encode(message.processFuncData, writer.uint32(/* id 23, wireType 2 =*/186).fork()).ldelim();
        if (message.hiperfData != null && Object.hasOwnProperty.call(message, "hiperfData"))
            $root.SphHiperfData.encode(message.hiperfData, writer.uint32(/* id 24, wireType 2 =*/194).fork()).ldelim();
        if (message.hiperfCallChartData != null && Object.hasOwnProperty.call(message, "hiperfCallChartData"))
            $root.SphHiperfCallChartData.encode(message.hiperfCallChartData, writer.uint32(/* id 25, wireType 2 =*/202).fork()).ldelim();
        if (message.hiperfCallStackData != null && Object.hasOwnProperty.call(message, "hiperfCallStackData"))
            $root.SphHiperfCallStackData.encode(message.hiperfCallStackData, writer.uint32(/* id 26, wireType 2 =*/210).fork()).ldelim();
        if (message.processJanksFramesData != null && Object.hasOwnProperty.call(message, "processJanksFramesData"))
            $root.SphProcessJanksFramesData.encode(message.processJanksFramesData, writer.uint32(/* id 27, wireType 2 =*/218).fork()).ldelim();
        if (message.processJanksActualData != null && Object.hasOwnProperty.call(message, "processJanksActualData"))
            $root.SphProcessJanksActualData.encode(message.processJanksActualData, writer.uint32(/* id 28, wireType 2 =*/226).fork()).ldelim();
        if (message.processInputEventData != null && Object.hasOwnProperty.call(message, "processInputEventData"))
            $root.SphProcessInputEventData.encode(message.processInputEventData, writer.uint32(/* id 29, wireType 2 =*/234).fork()).ldelim();
        if (message.heapFilesData != null && Object.hasOwnProperty.call(message, "heapFilesData"))
            $root.SphHeapFilesData.encode(message.heapFilesData, writer.uint32(/* id 30, wireType 2 =*/242).fork()).ldelim();
        if (message.cpuProfilerData != null && Object.hasOwnProperty.call(message, "cpuProfilerData"))
            $root.SphCpuProfilerData.encode(message.cpuProfilerData, writer.uint32(/* id 31, wireType 2 =*/250).fork()).ldelim();
        if (message.nativeMemoryNormal != null && Object.hasOwnProperty.call(message, "nativeMemoryNormal"))
            $root.SphNativeMemoryNormalData.encode(message.nativeMemoryNormal, writer.uint32(/* id 32, wireType 2 =*/258).fork()).ldelim();
        if (message.nativeMemoryStatistic != null && Object.hasOwnProperty.call(message, "nativeMemoryStatistic"))
            $root.SphNativeMemoryStatisticData.encode(message.nativeMemoryStatistic, writer.uint32(/* id 33, wireType 2 =*/266).fork()).ldelim();
        if (message.cpuAbilityData != null && Object.hasOwnProperty.call(message, "cpuAbilityData"))
            $root.SphCpuAbilityData.encode(message.cpuAbilityData, writer.uint32(/* id 34, wireType 2 =*/274).fork()).ldelim();
        return writer;
    };

    /**
     * Encodes the specified SphData message, length delimited. Does not implicitly {@link SphData.verify|verify} messages.
     * @function encodeDelimited
     * @memberof SphData
     * @static
     * @param {ISphData} message SphData message or plain object to encode
     * @param {$protobuf.Writer} [writer] Writer to encode to
     * @returns {$protobuf.Writer} Writer
     */
    SphData.encodeDelimited = function encodeDelimited(message, writer) {
        return this.encode(message, writer).ldelim();
    };

    /**
     * Decodes a SphData message from the specified reader or buffer.
     * @function decode
     * @memberof SphData
     * @static
     * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
     * @param {number} [length] Message length if known beforehand
     * @returns {SphData} SphData
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    SphData.decode = function decode(reader, length) {
        if (!(reader instanceof $Reader))
            reader = $Reader.create(reader);
        var end = length === undefined ? reader.len : reader.pos + length, message = new $root.SphData();
        while (reader.pos < end) {
            var tag = reader.uint32();
            switch (tag >>> 3) {
            case 1: {
                    message.cpuData = $root.SphCpuData.decode(reader, reader.uint32());
                    break;
                }
            case 2: {
                    message.cpuStateData = $root.SphCpuStateData.decode(reader, reader.uint32());
                    break;
                }
            case 3: {
                    message.cpuFreqData = $root.SphCpuFreqData.decode(reader, reader.uint32());
                    break;
                }
            case 4: {
                    message.cpuFreqLimitData = $root.SphCpuFreqLimitData.decode(reader, reader.uint32());
                    break;
                }
            case 5: {
                    message.clockData = $root.SphClockData.decode(reader, reader.uint32());
                    break;
                }
            case 6: {
                    message.irqData = $root.SphIrqData.decode(reader, reader.uint32());
                    break;
                }
            case 7: {
                    message.processData = $root.SphProcessData.decode(reader, reader.uint32());
                    break;
                }
            case 8: {
                    message.processMemData = $root.SphProcessMemData.decode(reader, reader.uint32());
                    break;
                }
            case 9: {
                    message.processStartupData = $root.SphProcessStartupData.decode(reader, reader.uint32());
                    break;
                }
            case 10: {
                    message.processSoInitData = $root.SphProcessSoInitData.decode(reader, reader.uint32());
                    break;
                }
            case 11: {
                    message.hiSysEventData = $root.SphHiSysEventData.decode(reader, reader.uint32());
                    break;
                }
            case 12: {
                    message.logData = $root.SphLogData.decode(reader, reader.uint32());
                    break;
                }
            case 13: {
                    message.virtualMemData = $root.SphVirtualMemData.decode(reader, reader.uint32());
                    break;
                }
            case 14: {
                    message.energyData = $root.SphEnergyData.decode(reader, reader.uint32());
                    break;
                }
            case 15: {
                    message.frameData = $root.SphFrameData.decode(reader, reader.uint32());
                    break;
                }
            case 16: {
                    message.frameAnimationData = $root.SphFrameAnimationData.decode(reader, reader.uint32());
                    break;
                }
            case 17: {
                    message.frameDynamicData = $root.SphFrameDynamicData.decode(reader, reader.uint32());
                    break;
                }
            case 18: {
                    message.frameSpacingData = $root.SphFrameSpacingData.decode(reader, reader.uint32());
                    break;
                }
            case 19: {
                    message.ebpfData = $root.SphEbpfData.decode(reader, reader.uint32());
                    break;
                }
            case 20: {
                    message.trackerData = $root.SphTrackerData.decode(reader, reader.uint32());
                    break;
                }
            case 21: {
                    message.abilityData = $root.SphAbilityData.decode(reader, reader.uint32());
                    break;
                }
            case 22: {
                    message.processThreadData = $root.SphProcessThreadData.decode(reader, reader.uint32());
                    break;
                }
            case 23: {
                    message.processFuncData = $root.SphProcessFuncData.decode(reader, reader.uint32());
                    break;
                }
            case 24: {
                    message.hiperfData = $root.SphHiperfData.decode(reader, reader.uint32());
                    break;
                }
            case 25: {
                    message.hiperfCallChartData = $root.SphHiperfCallChartData.decode(reader, reader.uint32());
                    break;
                }
            case 26: {
                    message.hiperfCallStackData = $root.SphHiperfCallStackData.decode(reader, reader.uint32());
                    break;
                }
            case 27: {
                    message.processJanksFramesData = $root.SphProcessJanksFramesData.decode(reader, reader.uint32());
                    break;
                }
            case 28: {
                    message.processJanksActualData = $root.SphProcessJanksActualData.decode(reader, reader.uint32());
                    break;
                }
            case 29: {
                    message.processInputEventData = $root.SphProcessInputEventData.decode(reader, reader.uint32());
                    break;
                }
            case 30: {
                    message.heapFilesData = $root.SphHeapFilesData.decode(reader, reader.uint32());
                    break;
                }
            case 31: {
                    message.cpuProfilerData = $root.SphCpuProfilerData.decode(reader, reader.uint32());
                    break;
                }
            case 32: {
                    message.nativeMemoryNormal = $root.SphNativeMemoryNormalData.decode(reader, reader.uint32());
                    break;
                }
            case 33: {
                    message.nativeMemoryStatistic = $root.SphNativeMemoryStatisticData.decode(reader, reader.uint32());
                    break;
                }
            case 34: {
                    message.cpuAbilityData = $root.SphCpuAbilityData.decode(reader, reader.uint32());
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
     * Decodes a SphData message from the specified reader or buffer, length delimited.
     * @function decodeDelimited
     * @memberof SphData
     * @static
     * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
     * @returns {SphData} SphData
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    SphData.decodeDelimited = function decodeDelimited(reader) {
        if (!(reader instanceof $Reader))
            reader = new $Reader(reader);
        return this.decode(reader, reader.uint32());
    };

    /**
     * Verifies a SphData message.
     * @function verify
     * @memberof SphData
     * @static
     * @param {Object.<string,*>} message Plain object to verify
     * @returns {string|null} `null` if valid, otherwise the reason why it is not
     */
    SphData.verify = function verify(message) {
        if (typeof message !== "object" || message === null)
            return "object expected";
        var properties = {};
        if (message.cpuData != null && message.hasOwnProperty("cpuData")) {
            properties.event = 1;
            {
                var error = $root.SphCpuData.verify(message.cpuData);
                if (error)
                    return "cpuData." + error;
            }
        }
        if (message.cpuStateData != null && message.hasOwnProperty("cpuStateData")) {
            if (properties.event === 1)
                return "event: multiple values";
            properties.event = 1;
            {
                var error = $root.SphCpuStateData.verify(message.cpuStateData);
                if (error)
                    return "cpuStateData." + error;
            }
        }
        if (message.cpuFreqData != null && message.hasOwnProperty("cpuFreqData")) {
            if (properties.event === 1)
                return "event: multiple values";
            properties.event = 1;
            {
                var error = $root.SphCpuFreqData.verify(message.cpuFreqData);
                if (error)
                    return "cpuFreqData." + error;
            }
        }
        if (message.cpuFreqLimitData != null && message.hasOwnProperty("cpuFreqLimitData")) {
            if (properties.event === 1)
                return "event: multiple values";
            properties.event = 1;
            {
                var error = $root.SphCpuFreqLimitData.verify(message.cpuFreqLimitData);
                if (error)
                    return "cpuFreqLimitData." + error;
            }
        }
        if (message.clockData != null && message.hasOwnProperty("clockData")) {
            if (properties.event === 1)
                return "event: multiple values";
            properties.event = 1;
            {
                var error = $root.SphClockData.verify(message.clockData);
                if (error)
                    return "clockData." + error;
            }
        }
        if (message.irqData != null && message.hasOwnProperty("irqData")) {
            if (properties.event === 1)
                return "event: multiple values";
            properties.event = 1;
            {
                var error = $root.SphIrqData.verify(message.irqData);
                if (error)
                    return "irqData." + error;
            }
        }
        if (message.processData != null && message.hasOwnProperty("processData")) {
            if (properties.event === 1)
                return "event: multiple values";
            properties.event = 1;
            {
                var error = $root.SphProcessData.verify(message.processData);
                if (error)
                    return "processData." + error;
            }
        }
        if (message.processMemData != null && message.hasOwnProperty("processMemData")) {
            if (properties.event === 1)
                return "event: multiple values";
            properties.event = 1;
            {
                var error = $root.SphProcessMemData.verify(message.processMemData);
                if (error)
                    return "processMemData." + error;
            }
        }
        if (message.processStartupData != null && message.hasOwnProperty("processStartupData")) {
            if (properties.event === 1)
                return "event: multiple values";
            properties.event = 1;
            {
                var error = $root.SphProcessStartupData.verify(message.processStartupData);
                if (error)
                    return "processStartupData." + error;
            }
        }
        if (message.processSoInitData != null && message.hasOwnProperty("processSoInitData")) {
            if (properties.event === 1)
                return "event: multiple values";
            properties.event = 1;
            {
                var error = $root.SphProcessSoInitData.verify(message.processSoInitData);
                if (error)
                    return "processSoInitData." + error;
            }
        }
        if (message.hiSysEventData != null && message.hasOwnProperty("hiSysEventData")) {
            if (properties.event === 1)
                return "event: multiple values";
            properties.event = 1;
            {
                var error = $root.SphHiSysEventData.verify(message.hiSysEventData);
                if (error)
                    return "hiSysEventData." + error;
            }
        }
        if (message.logData != null && message.hasOwnProperty("logData")) {
            if (properties.event === 1)
                return "event: multiple values";
            properties.event = 1;
            {
                var error = $root.SphLogData.verify(message.logData);
                if (error)
                    return "logData." + error;
            }
        }
        if (message.virtualMemData != null && message.hasOwnProperty("virtualMemData")) {
            if (properties.event === 1)
                return "event: multiple values";
            properties.event = 1;
            {
                var error = $root.SphVirtualMemData.verify(message.virtualMemData);
                if (error)
                    return "virtualMemData." + error;
            }
        }
        if (message.energyData != null && message.hasOwnProperty("energyData")) {
            if (properties.event === 1)
                return "event: multiple values";
            properties.event = 1;
            {
                var error = $root.SphEnergyData.verify(message.energyData);
                if (error)
                    return "energyData." + error;
            }
        }
        if (message.frameData != null && message.hasOwnProperty("frameData")) {
            if (properties.event === 1)
                return "event: multiple values";
            properties.event = 1;
            {
                var error = $root.SphFrameData.verify(message.frameData);
                if (error)
                    return "frameData." + error;
            }
        }
        if (message.frameAnimationData != null && message.hasOwnProperty("frameAnimationData")) {
            if (properties.event === 1)
                return "event: multiple values";
            properties.event = 1;
            {
                var error = $root.SphFrameAnimationData.verify(message.frameAnimationData);
                if (error)
                    return "frameAnimationData." + error;
            }
        }
        if (message.frameDynamicData != null && message.hasOwnProperty("frameDynamicData")) {
            if (properties.event === 1)
                return "event: multiple values";
            properties.event = 1;
            {
                var error = $root.SphFrameDynamicData.verify(message.frameDynamicData);
                if (error)
                    return "frameDynamicData." + error;
            }
        }
        if (message.frameSpacingData != null && message.hasOwnProperty("frameSpacingData")) {
            if (properties.event === 1)
                return "event: multiple values";
            properties.event = 1;
            {
                var error = $root.SphFrameSpacingData.verify(message.frameSpacingData);
                if (error)
                    return "frameSpacingData." + error;
            }
        }
        if (message.ebpfData != null && message.hasOwnProperty("ebpfData")) {
            if (properties.event === 1)
                return "event: multiple values";
            properties.event = 1;
            {
                var error = $root.SphEbpfData.verify(message.ebpfData);
                if (error)
                    return "ebpfData." + error;
            }
        }
        if (message.trackerData != null && message.hasOwnProperty("trackerData")) {
            if (properties.event === 1)
                return "event: multiple values";
            properties.event = 1;
            {
                var error = $root.SphTrackerData.verify(message.trackerData);
                if (error)
                    return "trackerData." + error;
            }
        }
        if (message.abilityData != null && message.hasOwnProperty("abilityData")) {
            if (properties.event === 1)
                return "event: multiple values";
            properties.event = 1;
            {
                var error = $root.SphAbilityData.verify(message.abilityData);
                if (error)
                    return "abilityData." + error;
            }
        }
        if (message.processThreadData != null && message.hasOwnProperty("processThreadData")) {
            if (properties.event === 1)
                return "event: multiple values";
            properties.event = 1;
            {
                var error = $root.SphProcessThreadData.verify(message.processThreadData);
                if (error)
                    return "processThreadData." + error;
            }
        }
        if (message.processFuncData != null && message.hasOwnProperty("processFuncData")) {
            if (properties.event === 1)
                return "event: multiple values";
            properties.event = 1;
            {
                var error = $root.SphProcessFuncData.verify(message.processFuncData);
                if (error)
                    return "processFuncData." + error;
            }
        }
        if (message.hiperfData != null && message.hasOwnProperty("hiperfData")) {
            if (properties.event === 1)
                return "event: multiple values";
            properties.event = 1;
            {
                var error = $root.SphHiperfData.verify(message.hiperfData);
                if (error)
                    return "hiperfData." + error;
            }
        }
        if (message.hiperfCallChartData != null && message.hasOwnProperty("hiperfCallChartData")) {
            if (properties.event === 1)
                return "event: multiple values";
            properties.event = 1;
            {
                var error = $root.SphHiperfCallChartData.verify(message.hiperfCallChartData);
                if (error)
                    return "hiperfCallChartData." + error;
            }
        }
        if (message.hiperfCallStackData != null && message.hasOwnProperty("hiperfCallStackData")) {
            if (properties.event === 1)
                return "event: multiple values";
            properties.event = 1;
            {
                var error = $root.SphHiperfCallStackData.verify(message.hiperfCallStackData);
                if (error)
                    return "hiperfCallStackData." + error;
            }
        }
        if (message.processJanksFramesData != null && message.hasOwnProperty("processJanksFramesData")) {
            if (properties.event === 1)
                return "event: multiple values";
            properties.event = 1;
            {
                var error = $root.SphProcessJanksFramesData.verify(message.processJanksFramesData);
                if (error)
                    return "processJanksFramesData." + error;
            }
        }
        if (message.processJanksActualData != null && message.hasOwnProperty("processJanksActualData")) {
            if (properties.event === 1)
                return "event: multiple values";
            properties.event = 1;
            {
                var error = $root.SphProcessJanksActualData.verify(message.processJanksActualData);
                if (error)
                    return "processJanksActualData." + error;
            }
        }
        if (message.processInputEventData != null && message.hasOwnProperty("processInputEventData")) {
            if (properties.event === 1)
                return "event: multiple values";
            properties.event = 1;
            {
                var error = $root.SphProcessInputEventData.verify(message.processInputEventData);
                if (error)
                    return "processInputEventData." + error;
            }
        }
        if (message.heapFilesData != null && message.hasOwnProperty("heapFilesData")) {
            if (properties.event === 1)
                return "event: multiple values";
            properties.event = 1;
            {
                var error = $root.SphHeapFilesData.verify(message.heapFilesData);
                if (error)
                    return "heapFilesData." + error;
            }
        }
        if (message.cpuProfilerData != null && message.hasOwnProperty("cpuProfilerData")) {
            if (properties.event === 1)
                return "event: multiple values";
            properties.event = 1;
            {
                var error = $root.SphCpuProfilerData.verify(message.cpuProfilerData);
                if (error)
                    return "cpuProfilerData." + error;
            }
        }
        if (message.nativeMemoryNormal != null && message.hasOwnProperty("nativeMemoryNormal")) {
            if (properties.event === 1)
                return "event: multiple values";
            properties.event = 1;
            {
                var error = $root.SphNativeMemoryNormalData.verify(message.nativeMemoryNormal);
                if (error)
                    return "nativeMemoryNormal." + error;
            }
        }
        if (message.nativeMemoryStatistic != null && message.hasOwnProperty("nativeMemoryStatistic")) {
            if (properties.event === 1)
                return "event: multiple values";
            properties.event = 1;
            {
                var error = $root.SphNativeMemoryStatisticData.verify(message.nativeMemoryStatistic);
                if (error)
                    return "nativeMemoryStatistic." + error;
            }
        }
        if (message.cpuAbilityData != null && message.hasOwnProperty("cpuAbilityData")) {
            if (properties.event === 1)
                return "event: multiple values";
            properties.event = 1;
            {
                var error = $root.SphCpuAbilityData.verify(message.cpuAbilityData);
                if (error)
                    return "cpuAbilityData." + error;
            }
        }
        return null;
    };

    /**
     * Creates a SphData message from a plain object. Also converts values to their respective internal types.
     * @function fromObject
     * @memberof SphData
     * @static
     * @param {Object.<string,*>} object Plain object
     * @returns {SphData} SphData
     */
    SphData.fromObject = function fromObject(object) {
        if (object instanceof $root.SphData)
            return object;
        var message = new $root.SphData();
        if (object.cpuData != null) {
            if (typeof object.cpuData !== "object")
                throw TypeError(".SphData.cpuData: object expected");
            message.cpuData = $root.SphCpuData.fromObject(object.cpuData);
        }
        if (object.cpuStateData != null) {
            if (typeof object.cpuStateData !== "object")
                throw TypeError(".SphData.cpuStateData: object expected");
            message.cpuStateData = $root.SphCpuStateData.fromObject(object.cpuStateData);
        }
        if (object.cpuFreqData != null) {
            if (typeof object.cpuFreqData !== "object")
                throw TypeError(".SphData.cpuFreqData: object expected");
            message.cpuFreqData = $root.SphCpuFreqData.fromObject(object.cpuFreqData);
        }
        if (object.cpuFreqLimitData != null) {
            if (typeof object.cpuFreqLimitData !== "object")
                throw TypeError(".SphData.cpuFreqLimitData: object expected");
            message.cpuFreqLimitData = $root.SphCpuFreqLimitData.fromObject(object.cpuFreqLimitData);
        }
        if (object.clockData != null) {
            if (typeof object.clockData !== "object")
                throw TypeError(".SphData.clockData: object expected");
            message.clockData = $root.SphClockData.fromObject(object.clockData);
        }
        if (object.irqData != null) {
            if (typeof object.irqData !== "object")
                throw TypeError(".SphData.irqData: object expected");
            message.irqData = $root.SphIrqData.fromObject(object.irqData);
        }
        if (object.processData != null) {
            if (typeof object.processData !== "object")
                throw TypeError(".SphData.processData: object expected");
            message.processData = $root.SphProcessData.fromObject(object.processData);
        }
        if (object.processMemData != null) {
            if (typeof object.processMemData !== "object")
                throw TypeError(".SphData.processMemData: object expected");
            message.processMemData = $root.SphProcessMemData.fromObject(object.processMemData);
        }
        if (object.processStartupData != null) {
            if (typeof object.processStartupData !== "object")
                throw TypeError(".SphData.processStartupData: object expected");
            message.processStartupData = $root.SphProcessStartupData.fromObject(object.processStartupData);
        }
        if (object.processSoInitData != null) {
            if (typeof object.processSoInitData !== "object")
                throw TypeError(".SphData.processSoInitData: object expected");
            message.processSoInitData = $root.SphProcessSoInitData.fromObject(object.processSoInitData);
        }
        if (object.hiSysEventData != null) {
            if (typeof object.hiSysEventData !== "object")
                throw TypeError(".SphData.hiSysEventData: object expected");
            message.hiSysEventData = $root.SphHiSysEventData.fromObject(object.hiSysEventData);
        }
        if (object.logData != null) {
            if (typeof object.logData !== "object")
                throw TypeError(".SphData.logData: object expected");
            message.logData = $root.SphLogData.fromObject(object.logData);
        }
        if (object.virtualMemData != null) {
            if (typeof object.virtualMemData !== "object")
                throw TypeError(".SphData.virtualMemData: object expected");
            message.virtualMemData = $root.SphVirtualMemData.fromObject(object.virtualMemData);
        }
        if (object.energyData != null) {
            if (typeof object.energyData !== "object")
                throw TypeError(".SphData.energyData: object expected");
            message.energyData = $root.SphEnergyData.fromObject(object.energyData);
        }
        if (object.frameData != null) {
            if (typeof object.frameData !== "object")
                throw TypeError(".SphData.frameData: object expected");
            message.frameData = $root.SphFrameData.fromObject(object.frameData);
        }
        if (object.frameAnimationData != null) {
            if (typeof object.frameAnimationData !== "object")
                throw TypeError(".SphData.frameAnimationData: object expected");
            message.frameAnimationData = $root.SphFrameAnimationData.fromObject(object.frameAnimationData);
        }
        if (object.frameDynamicData != null) {
            if (typeof object.frameDynamicData !== "object")
                throw TypeError(".SphData.frameDynamicData: object expected");
            message.frameDynamicData = $root.SphFrameDynamicData.fromObject(object.frameDynamicData);
        }
        if (object.frameSpacingData != null) {
            if (typeof object.frameSpacingData !== "object")
                throw TypeError(".SphData.frameSpacingData: object expected");
            message.frameSpacingData = $root.SphFrameSpacingData.fromObject(object.frameSpacingData);
        }
        if (object.ebpfData != null) {
            if (typeof object.ebpfData !== "object")
                throw TypeError(".SphData.ebpfData: object expected");
            message.ebpfData = $root.SphEbpfData.fromObject(object.ebpfData);
        }
        if (object.trackerData != null) {
            if (typeof object.trackerData !== "object")
                throw TypeError(".SphData.trackerData: object expected");
            message.trackerData = $root.SphTrackerData.fromObject(object.trackerData);
        }
        if (object.abilityData != null) {
            if (typeof object.abilityData !== "object")
                throw TypeError(".SphData.abilityData: object expected");
            message.abilityData = $root.SphAbilityData.fromObject(object.abilityData);
        }
        if (object.processThreadData != null) {
            if (typeof object.processThreadData !== "object")
                throw TypeError(".SphData.processThreadData: object expected");
            message.processThreadData = $root.SphProcessThreadData.fromObject(object.processThreadData);
        }
        if (object.processFuncData != null) {
            if (typeof object.processFuncData !== "object")
                throw TypeError(".SphData.processFuncData: object expected");
            message.processFuncData = $root.SphProcessFuncData.fromObject(object.processFuncData);
        }
        if (object.hiperfData != null) {
            if (typeof object.hiperfData !== "object")
                throw TypeError(".SphData.hiperfData: object expected");
            message.hiperfData = $root.SphHiperfData.fromObject(object.hiperfData);
        }
        if (object.hiperfCallChartData != null) {
            if (typeof object.hiperfCallChartData !== "object")
                throw TypeError(".SphData.hiperfCallChartData: object expected");
            message.hiperfCallChartData = $root.SphHiperfCallChartData.fromObject(object.hiperfCallChartData);
        }
        if (object.hiperfCallStackData != null) {
            if (typeof object.hiperfCallStackData !== "object")
                throw TypeError(".SphData.hiperfCallStackData: object expected");
            message.hiperfCallStackData = $root.SphHiperfCallStackData.fromObject(object.hiperfCallStackData);
        }
        if (object.processJanksFramesData != null) {
            if (typeof object.processJanksFramesData !== "object")
                throw TypeError(".SphData.processJanksFramesData: object expected");
            message.processJanksFramesData = $root.SphProcessJanksFramesData.fromObject(object.processJanksFramesData);
        }
        if (object.processJanksActualData != null) {
            if (typeof object.processJanksActualData !== "object")
                throw TypeError(".SphData.processJanksActualData: object expected");
            message.processJanksActualData = $root.SphProcessJanksActualData.fromObject(object.processJanksActualData);
        }
        if (object.processInputEventData != null) {
            if (typeof object.processInputEventData !== "object")
                throw TypeError(".SphData.processInputEventData: object expected");
            message.processInputEventData = $root.SphProcessInputEventData.fromObject(object.processInputEventData);
        }
        if (object.heapFilesData != null) {
            if (typeof object.heapFilesData !== "object")
                throw TypeError(".SphData.heapFilesData: object expected");
            message.heapFilesData = $root.SphHeapFilesData.fromObject(object.heapFilesData);
        }
        if (object.cpuProfilerData != null) {
            if (typeof object.cpuProfilerData !== "object")
                throw TypeError(".SphData.cpuProfilerData: object expected");
            message.cpuProfilerData = $root.SphCpuProfilerData.fromObject(object.cpuProfilerData);
        }
        if (object.nativeMemoryNormal != null) {
            if (typeof object.nativeMemoryNormal !== "object")
                throw TypeError(".SphData.nativeMemoryNormal: object expected");
            message.nativeMemoryNormal = $root.SphNativeMemoryNormalData.fromObject(object.nativeMemoryNormal);
        }
        if (object.nativeMemoryStatistic != null) {
            if (typeof object.nativeMemoryStatistic !== "object")
                throw TypeError(".SphData.nativeMemoryStatistic: object expected");
            message.nativeMemoryStatistic = $root.SphNativeMemoryStatisticData.fromObject(object.nativeMemoryStatistic);
        }
        if (object.cpuAbilityData != null) {
            if (typeof object.cpuAbilityData !== "object")
                throw TypeError(".SphData.cpuAbilityData: object expected");
            message.cpuAbilityData = $root.SphCpuAbilityData.fromObject(object.cpuAbilityData);
        }
        return message;
    };

    /**
     * Creates a plain object from a SphData message. Also converts values to other types if specified.
     * @function toObject
     * @memberof SphData
     * @static
     * @param {SphData} message SphData
     * @param {$protobuf.IConversionOptions} [options] Conversion options
     * @returns {Object.<string,*>} Plain object
     */
    SphData.toObject = function toObject(message, options) {
        if (!options)
            options = {};
        var object = {};
        if (message.cpuData != null && message.hasOwnProperty("cpuData")) {
            object.cpuData = $root.SphCpuData.toObject(message.cpuData, options);
            if (options.oneofs)
                object.event = "cpuData";
        }
        if (message.cpuStateData != null && message.hasOwnProperty("cpuStateData")) {
            object.cpuStateData = $root.SphCpuStateData.toObject(message.cpuStateData, options);
            if (options.oneofs)
                object.event = "cpuStateData";
        }
        if (message.cpuFreqData != null && message.hasOwnProperty("cpuFreqData")) {
            object.cpuFreqData = $root.SphCpuFreqData.toObject(message.cpuFreqData, options);
            if (options.oneofs)
                object.event = "cpuFreqData";
        }
        if (message.cpuFreqLimitData != null && message.hasOwnProperty("cpuFreqLimitData")) {
            object.cpuFreqLimitData = $root.SphCpuFreqLimitData.toObject(message.cpuFreqLimitData, options);
            if (options.oneofs)
                object.event = "cpuFreqLimitData";
        }
        if (message.clockData != null && message.hasOwnProperty("clockData")) {
            object.clockData = $root.SphClockData.toObject(message.clockData, options);
            if (options.oneofs)
                object.event = "clockData";
        }
        if (message.irqData != null && message.hasOwnProperty("irqData")) {
            object.irqData = $root.SphIrqData.toObject(message.irqData, options);
            if (options.oneofs)
                object.event = "irqData";
        }
        if (message.processData != null && message.hasOwnProperty("processData")) {
            object.processData = $root.SphProcessData.toObject(message.processData, options);
            if (options.oneofs)
                object.event = "processData";
        }
        if (message.processMemData != null && message.hasOwnProperty("processMemData")) {
            object.processMemData = $root.SphProcessMemData.toObject(message.processMemData, options);
            if (options.oneofs)
                object.event = "processMemData";
        }
        if (message.processStartupData != null && message.hasOwnProperty("processStartupData")) {
            object.processStartupData = $root.SphProcessStartupData.toObject(message.processStartupData, options);
            if (options.oneofs)
                object.event = "processStartupData";
        }
        if (message.processSoInitData != null && message.hasOwnProperty("processSoInitData")) {
            object.processSoInitData = $root.SphProcessSoInitData.toObject(message.processSoInitData, options);
            if (options.oneofs)
                object.event = "processSoInitData";
        }
        if (message.hiSysEventData != null && message.hasOwnProperty("hiSysEventData")) {
            object.hiSysEventData = $root.SphHiSysEventData.toObject(message.hiSysEventData, options);
            if (options.oneofs)
                object.event = "hiSysEventData";
        }
        if (message.logData != null && message.hasOwnProperty("logData")) {
            object.logData = $root.SphLogData.toObject(message.logData, options);
            if (options.oneofs)
                object.event = "logData";
        }
        if (message.virtualMemData != null && message.hasOwnProperty("virtualMemData")) {
            object.virtualMemData = $root.SphVirtualMemData.toObject(message.virtualMemData, options);
            if (options.oneofs)
                object.event = "virtualMemData";
        }
        if (message.energyData != null && message.hasOwnProperty("energyData")) {
            object.energyData = $root.SphEnergyData.toObject(message.energyData, options);
            if (options.oneofs)
                object.event = "energyData";
        }
        if (message.frameData != null && message.hasOwnProperty("frameData")) {
            object.frameData = $root.SphFrameData.toObject(message.frameData, options);
            if (options.oneofs)
                object.event = "frameData";
        }
        if (message.frameAnimationData != null && message.hasOwnProperty("frameAnimationData")) {
            object.frameAnimationData = $root.SphFrameAnimationData.toObject(message.frameAnimationData, options);
            if (options.oneofs)
                object.event = "frameAnimationData";
        }
        if (message.frameDynamicData != null && message.hasOwnProperty("frameDynamicData")) {
            object.frameDynamicData = $root.SphFrameDynamicData.toObject(message.frameDynamicData, options);
            if (options.oneofs)
                object.event = "frameDynamicData";
        }
        if (message.frameSpacingData != null && message.hasOwnProperty("frameSpacingData")) {
            object.frameSpacingData = $root.SphFrameSpacingData.toObject(message.frameSpacingData, options);
            if (options.oneofs)
                object.event = "frameSpacingData";
        }
        if (message.ebpfData != null && message.hasOwnProperty("ebpfData")) {
            object.ebpfData = $root.SphEbpfData.toObject(message.ebpfData, options);
            if (options.oneofs)
                object.event = "ebpfData";
        }
        if (message.trackerData != null && message.hasOwnProperty("trackerData")) {
            object.trackerData = $root.SphTrackerData.toObject(message.trackerData, options);
            if (options.oneofs)
                object.event = "trackerData";
        }
        if (message.abilityData != null && message.hasOwnProperty("abilityData")) {
            object.abilityData = $root.SphAbilityData.toObject(message.abilityData, options);
            if (options.oneofs)
                object.event = "abilityData";
        }
        if (message.processThreadData != null && message.hasOwnProperty("processThreadData")) {
            object.processThreadData = $root.SphProcessThreadData.toObject(message.processThreadData, options);
            if (options.oneofs)
                object.event = "processThreadData";
        }
        if (message.processFuncData != null && message.hasOwnProperty("processFuncData")) {
            object.processFuncData = $root.SphProcessFuncData.toObject(message.processFuncData, options);
            if (options.oneofs)
                object.event = "processFuncData";
        }
        if (message.hiperfData != null && message.hasOwnProperty("hiperfData")) {
            object.hiperfData = $root.SphHiperfData.toObject(message.hiperfData, options);
            if (options.oneofs)
                object.event = "hiperfData";
        }
        if (message.hiperfCallChartData != null && message.hasOwnProperty("hiperfCallChartData")) {
            object.hiperfCallChartData = $root.SphHiperfCallChartData.toObject(message.hiperfCallChartData, options);
            if (options.oneofs)
                object.event = "hiperfCallChartData";
        }
        if (message.hiperfCallStackData != null && message.hasOwnProperty("hiperfCallStackData")) {
            object.hiperfCallStackData = $root.SphHiperfCallStackData.toObject(message.hiperfCallStackData, options);
            if (options.oneofs)
                object.event = "hiperfCallStackData";
        }
        if (message.processJanksFramesData != null && message.hasOwnProperty("processJanksFramesData")) {
            object.processJanksFramesData = $root.SphProcessJanksFramesData.toObject(message.processJanksFramesData, options);
            if (options.oneofs)
                object.event = "processJanksFramesData";
        }
        if (message.processJanksActualData != null && message.hasOwnProperty("processJanksActualData")) {
            object.processJanksActualData = $root.SphProcessJanksActualData.toObject(message.processJanksActualData, options);
            if (options.oneofs)
                object.event = "processJanksActualData";
        }
        if (message.processInputEventData != null && message.hasOwnProperty("processInputEventData")) {
            object.processInputEventData = $root.SphProcessInputEventData.toObject(message.processInputEventData, options);
            if (options.oneofs)
                object.event = "processInputEventData";
        }
        if (message.heapFilesData != null && message.hasOwnProperty("heapFilesData")) {
            object.heapFilesData = $root.SphHeapFilesData.toObject(message.heapFilesData, options);
            if (options.oneofs)
                object.event = "heapFilesData";
        }
        if (message.cpuProfilerData != null && message.hasOwnProperty("cpuProfilerData")) {
            object.cpuProfilerData = $root.SphCpuProfilerData.toObject(message.cpuProfilerData, options);
            if (options.oneofs)
                object.event = "cpuProfilerData";
        }
        if (message.nativeMemoryNormal != null && message.hasOwnProperty("nativeMemoryNormal")) {
            object.nativeMemoryNormal = $root.SphNativeMemoryNormalData.toObject(message.nativeMemoryNormal, options);
            if (options.oneofs)
                object.event = "nativeMemoryNormal";
        }
        if (message.nativeMemoryStatistic != null && message.hasOwnProperty("nativeMemoryStatistic")) {
            object.nativeMemoryStatistic = $root.SphNativeMemoryStatisticData.toObject(message.nativeMemoryStatistic, options);
            if (options.oneofs)
                object.event = "nativeMemoryStatistic";
        }
        if (message.cpuAbilityData != null && message.hasOwnProperty("cpuAbilityData")) {
            object.cpuAbilityData = $root.SphCpuAbilityData.toObject(message.cpuAbilityData, options);
            if (options.oneofs)
                object.event = "cpuAbilityData";
        }
        return object;
    };

    /**
     * Converts this SphData to JSON.
     * @function toJSON
     * @memberof SphData
     * @instance
     * @returns {Object.<string,*>} JSON object
     */
    SphData.prototype.toJSON = function toJSON() {
        return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
    };

    /**
     * Gets the default type url for SphData
     * @function getTypeUrl
     * @memberof SphData
     * @static
     * @param {string} [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
     * @returns {string} The default type url
     */
    SphData.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
        if (typeUrlPrefix === undefined) {
            typeUrlPrefix = "type.googleapis.com";
        }
        return typeUrlPrefix + "/SphData";
    };

    return SphData;
})();

$root.BatchSphData = (function() {

    /**
     * Properties of a BatchSphData.
     * @exports IBatchSphData
     * @interface IBatchSphData
     * @property {Array.<ISphData>|null} [values] BatchSphData values
     */

    /**
     * Constructs a new BatchSphData.
     * @exports BatchSphData
     * @classdesc Represents a BatchSphData.
     * @implements IBatchSphData
     * @constructor
     * @param {IBatchSphData=} [properties] Properties to set
     */
    function BatchSphData(properties) {
        this.values = [];
        if (properties)
            for (var keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                if (properties[keys[i]] != null)
                    this[keys[i]] = properties[keys[i]];
    }

    /**
     * BatchSphData values.
     * @member {Array.<ISphData>} values
     * @memberof BatchSphData
     * @instance
     */
    BatchSphData.prototype.values = $util.emptyArray;

    /**
     * Creates a new BatchSphData instance using the specified properties.
     * @function create
     * @memberof BatchSphData
     * @static
     * @param {IBatchSphData=} [properties] Properties to set
     * @returns {BatchSphData} BatchSphData instance
     */
    BatchSphData.create = function create(properties) {
        return new BatchSphData(properties);
    };

    /**
     * Encodes the specified BatchSphData message. Does not implicitly {@link BatchSphData.verify|verify} messages.
     * @function encode
     * @memberof BatchSphData
     * @static
     * @param {IBatchSphData} message BatchSphData message or plain object to encode
     * @param {$protobuf.Writer} [writer] Writer to encode to
     * @returns {$protobuf.Writer} Writer
     */
    BatchSphData.encode = function encode(message, writer) {
        if (!writer)
            writer = $Writer.create();
        if (message.values != null && message.values.length)
            for (var i = 0; i < message.values.length; ++i)
                $root.SphData.encode(message.values[i], writer.uint32(/* id 1, wireType 2 =*/10).fork()).ldelim();
        return writer;
    };

    /**
     * Encodes the specified BatchSphData message, length delimited. Does not implicitly {@link BatchSphData.verify|verify} messages.
     * @function encodeDelimited
     * @memberof BatchSphData
     * @static
     * @param {IBatchSphData} message BatchSphData message or plain object to encode
     * @param {$protobuf.Writer} [writer] Writer to encode to
     * @returns {$protobuf.Writer} Writer
     */
    BatchSphData.encodeDelimited = function encodeDelimited(message, writer) {
        return this.encode(message, writer).ldelim();
    };

    /**
     * Decodes a BatchSphData message from the specified reader or buffer.
     * @function decode
     * @memberof BatchSphData
     * @static
     * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
     * @param {number} [length] Message length if known beforehand
     * @returns {BatchSphData} BatchSphData
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    BatchSphData.decode = function decode(reader, length) {
        if (!(reader instanceof $Reader))
            reader = $Reader.create(reader);
        var end = length === undefined ? reader.len : reader.pos + length, message = new $root.BatchSphData();
        while (reader.pos < end) {
            var tag = reader.uint32();
            switch (tag >>> 3) {
            case 1: {
                    if (!(message.values && message.values.length))
                        message.values = [];
                    message.values.push($root.SphData.decode(reader, reader.uint32()));
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
     * Decodes a BatchSphData message from the specified reader or buffer, length delimited.
     * @function decodeDelimited
     * @memberof BatchSphData
     * @static
     * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
     * @returns {BatchSphData} BatchSphData
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    BatchSphData.decodeDelimited = function decodeDelimited(reader) {
        if (!(reader instanceof $Reader))
            reader = new $Reader(reader);
        return this.decode(reader, reader.uint32());
    };

    /**
     * Verifies a BatchSphData message.
     * @function verify
     * @memberof BatchSphData
     * @static
     * @param {Object.<string,*>} message Plain object to verify
     * @returns {string|null} `null` if valid, otherwise the reason why it is not
     */
    BatchSphData.verify = function verify(message) {
        if (typeof message !== "object" || message === null)
            return "object expected";
        if (message.values != null && message.hasOwnProperty("values")) {
            if (!Array.isArray(message.values))
                return "values: array expected";
            for (var i = 0; i < message.values.length; ++i) {
                var error = $root.SphData.verify(message.values[i]);
                if (error)
                    return "values." + error;
            }
        }
        return null;
    };

    /**
     * Creates a BatchSphData message from a plain object. Also converts values to their respective internal types.
     * @function fromObject
     * @memberof BatchSphData
     * @static
     * @param {Object.<string,*>} object Plain object
     * @returns {BatchSphData} BatchSphData
     */
    BatchSphData.fromObject = function fromObject(object) {
        if (object instanceof $root.BatchSphData)
            return object;
        var message = new $root.BatchSphData();
        if (object.values) {
            if (!Array.isArray(object.values))
                throw TypeError(".BatchSphData.values: array expected");
            message.values = [];
            for (var i = 0; i < object.values.length; ++i) {
                if (typeof object.values[i] !== "object")
                    throw TypeError(".BatchSphData.values: object expected");
                message.values[i] = $root.SphData.fromObject(object.values[i]);
            }
        }
        return message;
    };

    /**
     * Creates a plain object from a BatchSphData message. Also converts values to other types if specified.
     * @function toObject
     * @memberof BatchSphData
     * @static
     * @param {BatchSphData} message BatchSphData
     * @param {$protobuf.IConversionOptions} [options] Conversion options
     * @returns {Object.<string,*>} Plain object
     */
    BatchSphData.toObject = function toObject(message, options) {
        if (!options)
            options = {};
        var object = {};
        if (options.arrays || options.defaults)
            object.values = [];
        if (message.values && message.values.length) {
            object.values = [];
            for (var j = 0; j < message.values.length; ++j)
                object.values[j] = $root.SphData.toObject(message.values[j], options);
        }
        return object;
    };

    /**
     * Converts this BatchSphData to JSON.
     * @function toJSON
     * @memberof BatchSphData
     * @instance
     * @returns {Object.<string,*>} JSON object
     */
    BatchSphData.prototype.toJSON = function toJSON() {
        return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
    };

    /**
     * Gets the default type url for BatchSphData
     * @function getTypeUrl
     * @memberof BatchSphData
     * @static
     * @param {string} [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
     * @returns {string} The default type url
     */
    BatchSphData.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
        if (typeUrlPrefix === undefined) {
            typeUrlPrefix = "type.googleapis.com";
        }
        return typeUrlPrefix + "/BatchSphData";
    };

    return BatchSphData;
})();

module.exports = $root;
