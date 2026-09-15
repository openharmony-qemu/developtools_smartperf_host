/*eslint-disable block-scoped-var, id-length, no-control-regex, no-magic-numbers, no-prototype-builtins, no-redeclare, no-shadow, no-var, sort-vars*/
"use strict";

var $protobuf = require("protobufjs/minimal");

// Common aliases
var $Reader = $protobuf.Reader, $Writer = $protobuf.Writer, $util = $protobuf.util;

// Exported root namespace
var $root = $protobuf.roots["default"] || ($protobuf.roots["default"] = {});

$root.ProfilerPluginConfig = (function() {

    /**
     * Properties of a ProfilerPluginConfig.
     * @exports IProfilerPluginConfig
     * @interface IProfilerPluginConfig
     * @property {string|null} [name] ProfilerPluginConfig name
     * @property {string|null} [pluginSha256] ProfilerPluginConfig pluginSha256
     * @property {number|null} [sampleInterval] ProfilerPluginConfig sampleInterval
     * @property {Uint8Array|null} [configData] ProfilerPluginConfig configData
     * @property {string|null} [clock] ProfilerPluginConfig clock
     * @property {boolean|null} [isProtobufSerialize] ProfilerPluginConfig isProtobufSerialize
     */

    /**
     * Constructs a new ProfilerPluginConfig.
     * @exports ProfilerPluginConfig
     * @classdesc Represents a ProfilerPluginConfig.
     * @implements IProfilerPluginConfig
     * @constructor
     * @param {IProfilerPluginConfig=} [properties] Properties to set
     */
    function ProfilerPluginConfig(properties) {
        if (properties)
            for (var keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                if (properties[keys[i]] != null)
                    this[keys[i]] = properties[keys[i]];
    }

    /**
     * ProfilerPluginConfig name.
     * @member {string} name
     * @memberof ProfilerPluginConfig
     * @instance
     */
    ProfilerPluginConfig.prototype.name = "";

    /**
     * ProfilerPluginConfig pluginSha256.
     * @member {string} pluginSha256
     * @memberof ProfilerPluginConfig
     * @instance
     */
    ProfilerPluginConfig.prototype.pluginSha256 = "";

    /**
     * ProfilerPluginConfig sampleInterval.
     * @member {number} sampleInterval
     * @memberof ProfilerPluginConfig
     * @instance
     */
    ProfilerPluginConfig.prototype.sampleInterval = 0;

    /**
     * ProfilerPluginConfig configData.
     * @member {Uint8Array} configData
     * @memberof ProfilerPluginConfig
     * @instance
     */
    ProfilerPluginConfig.prototype.configData = $util.newBuffer([]);

    /**
     * ProfilerPluginConfig clock.
     * @member {string} clock
     * @memberof ProfilerPluginConfig
     * @instance
     */
    ProfilerPluginConfig.prototype.clock = "";

    /**
     * ProfilerPluginConfig isProtobufSerialize.
     * @member {boolean} isProtobufSerialize
     * @memberof ProfilerPluginConfig
     * @instance
     */
    ProfilerPluginConfig.prototype.isProtobufSerialize = false;

    /**
     * Creates a new ProfilerPluginConfig instance using the specified properties.
     * @function create
     * @memberof ProfilerPluginConfig
     * @static
     * @param {IProfilerPluginConfig=} [properties] Properties to set
     * @returns {ProfilerPluginConfig} ProfilerPluginConfig instance
     */
    ProfilerPluginConfig.create = function create(properties) {
        return new ProfilerPluginConfig(properties);
    };

    /**
     * Encodes the specified ProfilerPluginConfig message. Does not implicitly {@link ProfilerPluginConfig.verify|verify} messages.
     * @function encode
     * @memberof ProfilerPluginConfig
     * @static
     * @param {IProfilerPluginConfig} message ProfilerPluginConfig message or plain object to encode
     * @param {$protobuf.Writer} [writer] Writer to encode to
     * @returns {$protobuf.Writer} Writer
     */
    ProfilerPluginConfig.encode = function encode(message, writer) {
        if (!writer)
            writer = $Writer.create();
        if (message.name != null && Object.hasOwnProperty.call(message, "name"))
            writer.uint32(/* id 1, wireType 2 =*/10).string(message.name);
        if (message.pluginSha256 != null && Object.hasOwnProperty.call(message, "pluginSha256"))
            writer.uint32(/* id 2, wireType 2 =*/18).string(message.pluginSha256);
        if (message.sampleInterval != null && Object.hasOwnProperty.call(message, "sampleInterval"))
            writer.uint32(/* id 3, wireType 0 =*/24).uint32(message.sampleInterval);
        if (message.configData != null && Object.hasOwnProperty.call(message, "configData"))
            writer.uint32(/* id 4, wireType 2 =*/34).bytes(message.configData);
        if (message.clock != null && Object.hasOwnProperty.call(message, "clock"))
            writer.uint32(/* id 5, wireType 2 =*/42).string(message.clock);
        if (message.isProtobufSerialize != null && Object.hasOwnProperty.call(message, "isProtobufSerialize"))
            writer.uint32(/* id 6, wireType 0 =*/48).bool(message.isProtobufSerialize);
        return writer;
    };

    /**
     * Encodes the specified ProfilerPluginConfig message, length delimited. Does not implicitly {@link ProfilerPluginConfig.verify|verify} messages.
     * @function encodeDelimited
     * @memberof ProfilerPluginConfig
     * @static
     * @param {IProfilerPluginConfig} message ProfilerPluginConfig message or plain object to encode
     * @param {$protobuf.Writer} [writer] Writer to encode to
     * @returns {$protobuf.Writer} Writer
     */
    ProfilerPluginConfig.encodeDelimited = function encodeDelimited(message, writer) {
        return this.encode(message, writer).ldelim();
    };

    /**
     * Decodes a ProfilerPluginConfig message from the specified reader or buffer.
     * @function decode
     * @memberof ProfilerPluginConfig
     * @static
     * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
     * @param {number} [length] Message length if known beforehand
     * @returns {ProfilerPluginConfig} ProfilerPluginConfig
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    ProfilerPluginConfig.decode = function decode(reader, length) {
        if (!(reader instanceof $Reader))
            reader = $Reader.create(reader);
        var end = length === undefined ? reader.len : reader.pos + length, message = new $root.ProfilerPluginConfig();
        while (reader.pos < end) {
            var tag = reader.uint32();
            switch (tag >>> 3) {
            case 1: {
                    message.name = reader.string();
                    break;
                }
            case 2: {
                    message.pluginSha256 = reader.string();
                    break;
                }
            case 3: {
                    message.sampleInterval = reader.uint32();
                    break;
                }
            case 4: {
                    message.configData = reader.bytes();
                    break;
                }
            case 5: {
                    message.clock = reader.string();
                    break;
                }
            case 6: {
                    message.isProtobufSerialize = reader.bool();
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
     * Decodes a ProfilerPluginConfig message from the specified reader or buffer, length delimited.
     * @function decodeDelimited
     * @memberof ProfilerPluginConfig
     * @static
     * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
     * @returns {ProfilerPluginConfig} ProfilerPluginConfig
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    ProfilerPluginConfig.decodeDelimited = function decodeDelimited(reader) {
        if (!(reader instanceof $Reader))
            reader = new $Reader(reader);
        return this.decode(reader, reader.uint32());
    };

    /**
     * Verifies a ProfilerPluginConfig message.
     * @function verify
     * @memberof ProfilerPluginConfig
     * @static
     * @param {Object.<string,*>} message Plain object to verify
     * @returns {string|null} `null` if valid, otherwise the reason why it is not
     */
    ProfilerPluginConfig.verify = function verify(message) {
        if (typeof message !== "object" || message === null)
            return "object expected";
        if (message.name != null && message.hasOwnProperty("name"))
            if (!$util.isString(message.name))
                return "name: string expected";
        if (message.pluginSha256 != null && message.hasOwnProperty("pluginSha256"))
            if (!$util.isString(message.pluginSha256))
                return "pluginSha256: string expected";
        if (message.sampleInterval != null && message.hasOwnProperty("sampleInterval"))
            if (!$util.isInteger(message.sampleInterval))
                return "sampleInterval: integer expected";
        if (message.configData != null && message.hasOwnProperty("configData"))
            if (!(message.configData && typeof message.configData.length === "number" || $util.isString(message.configData)))
                return "configData: buffer expected";
        if (message.clock != null && message.hasOwnProperty("clock"))
            if (!$util.isString(message.clock))
                return "clock: string expected";
        if (message.isProtobufSerialize != null && message.hasOwnProperty("isProtobufSerialize"))
            if (typeof message.isProtobufSerialize !== "boolean")
                return "isProtobufSerialize: boolean expected";
        return null;
    };

    /**
     * Creates a ProfilerPluginConfig message from a plain object. Also converts values to their respective internal types.
     * @function fromObject
     * @memberof ProfilerPluginConfig
     * @static
     * @param {Object.<string,*>} object Plain object
     * @returns {ProfilerPluginConfig} ProfilerPluginConfig
     */
    ProfilerPluginConfig.fromObject = function fromObject(object) {
        if (object instanceof $root.ProfilerPluginConfig)
            return object;
        var message = new $root.ProfilerPluginConfig();
        if (object.name != null)
            message.name = String(object.name);
        if (object.pluginSha256 != null)
            message.pluginSha256 = String(object.pluginSha256);
        if (object.sampleInterval != null)
            message.sampleInterval = object.sampleInterval >>> 0;
        if (object.configData != null)
            if (typeof object.configData === "string")
                $util.base64.decode(object.configData, message.configData = $util.newBuffer($util.base64.length(object.configData)), 0);
            else if (object.configData.length >= 0)
                message.configData = object.configData;
        if (object.clock != null)
            message.clock = String(object.clock);
        if (object.isProtobufSerialize != null)
            message.isProtobufSerialize = Boolean(object.isProtobufSerialize);
        return message;
    };

    /**
     * Creates a plain object from a ProfilerPluginConfig message. Also converts values to other types if specified.
     * @function toObject
     * @memberof ProfilerPluginConfig
     * @static
     * @param {ProfilerPluginConfig} message ProfilerPluginConfig
     * @param {$protobuf.IConversionOptions} [options] Conversion options
     * @returns {Object.<string,*>} Plain object
     */
    ProfilerPluginConfig.toObject = function toObject(message, options) {
        if (!options)
            options = {};
        var object = {};
        if (options.defaults) {
            object.name = "";
            object.pluginSha256 = "";
            object.sampleInterval = 0;
            if (options.bytes === String)
                object.configData = "";
            else {
                object.configData = [];
                if (options.bytes !== Array)
                    object.configData = $util.newBuffer(object.configData);
            }
            object.clock = "";
            object.isProtobufSerialize = false;
        }
        if (message.name != null && message.hasOwnProperty("name"))
            object.name = message.name;
        if (message.pluginSha256 != null && message.hasOwnProperty("pluginSha256"))
            object.pluginSha256 = message.pluginSha256;
        if (message.sampleInterval != null && message.hasOwnProperty("sampleInterval"))
            object.sampleInterval = message.sampleInterval;
        if (message.configData != null && message.hasOwnProperty("configData"))
            object.configData = options.bytes === String ? $util.base64.encode(message.configData, 0, message.configData.length) : options.bytes === Array ? Array.prototype.slice.call(message.configData) : message.configData;
        if (message.clock != null && message.hasOwnProperty("clock"))
            object.clock = message.clock;
        if (message.isProtobufSerialize != null && message.hasOwnProperty("isProtobufSerialize"))
            object.isProtobufSerialize = message.isProtobufSerialize;
        return object;
    };

    /**
     * Converts this ProfilerPluginConfig to JSON.
     * @function toJSON
     * @memberof ProfilerPluginConfig
     * @instance
     * @returns {Object.<string,*>} JSON object
     */
    ProfilerPluginConfig.prototype.toJSON = function toJSON() {
        return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
    };

    /**
     * Gets the default type url for ProfilerPluginConfig
     * @function getTypeUrl
     * @memberof ProfilerPluginConfig
     * @static
     * @param {string} [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
     * @returns {string} The default type url
     */
    ProfilerPluginConfig.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
        if (typeUrlPrefix === undefined) {
            typeUrlPrefix = "type.googleapis.com";
        }
        return typeUrlPrefix + "/ProfilerPluginConfig";
    };

    return ProfilerPluginConfig;
})();

$root.ProfilerPluginState = (function() {

    /**
     * Properties of a ProfilerPluginState.
     * @exports IProfilerPluginState
     * @interface IProfilerPluginState
     * @property {string|null} [name] ProfilerPluginState name
     * @property {ProfilerPluginState.State|null} [state] ProfilerPluginState state
     */

    /**
     * Constructs a new ProfilerPluginState.
     * @exports ProfilerPluginState
     * @classdesc Represents a ProfilerPluginState.
     * @implements IProfilerPluginState
     * @constructor
     * @param {IProfilerPluginState=} [properties] Properties to set
     */
    function ProfilerPluginState(properties) {
        if (properties)
            for (var keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                if (properties[keys[i]] != null)
                    this[keys[i]] = properties[keys[i]];
    }

    /**
     * ProfilerPluginState name.
     * @member {string} name
     * @memberof ProfilerPluginState
     * @instance
     */
    ProfilerPluginState.prototype.name = "";

    /**
     * ProfilerPluginState state.
     * @member {ProfilerPluginState.State} state
     * @memberof ProfilerPluginState
     * @instance
     */
    ProfilerPluginState.prototype.state = 0;

    /**
     * Creates a new ProfilerPluginState instance using the specified properties.
     * @function create
     * @memberof ProfilerPluginState
     * @static
     * @param {IProfilerPluginState=} [properties] Properties to set
     * @returns {ProfilerPluginState} ProfilerPluginState instance
     */
    ProfilerPluginState.create = function create(properties) {
        return new ProfilerPluginState(properties);
    };

    /**
     * Encodes the specified ProfilerPluginState message. Does not implicitly {@link ProfilerPluginState.verify|verify} messages.
     * @function encode
     * @memberof ProfilerPluginState
     * @static
     * @param {IProfilerPluginState} message ProfilerPluginState message or plain object to encode
     * @param {$protobuf.Writer} [writer] Writer to encode to
     * @returns {$protobuf.Writer} Writer
     */
    ProfilerPluginState.encode = function encode(message, writer) {
        if (!writer)
            writer = $Writer.create();
        if (message.name != null && Object.hasOwnProperty.call(message, "name"))
            writer.uint32(/* id 1, wireType 2 =*/10).string(message.name);
        if (message.state != null && Object.hasOwnProperty.call(message, "state"))
            writer.uint32(/* id 2, wireType 0 =*/16).int32(message.state);
        return writer;
    };

    /**
     * Encodes the specified ProfilerPluginState message, length delimited. Does not implicitly {@link ProfilerPluginState.verify|verify} messages.
     * @function encodeDelimited
     * @memberof ProfilerPluginState
     * @static
     * @param {IProfilerPluginState} message ProfilerPluginState message or plain object to encode
     * @param {$protobuf.Writer} [writer] Writer to encode to
     * @returns {$protobuf.Writer} Writer
     */
    ProfilerPluginState.encodeDelimited = function encodeDelimited(message, writer) {
        return this.encode(message, writer).ldelim();
    };

    /**
     * Decodes a ProfilerPluginState message from the specified reader or buffer.
     * @function decode
     * @memberof ProfilerPluginState
     * @static
     * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
     * @param {number} [length] Message length if known beforehand
     * @returns {ProfilerPluginState} ProfilerPluginState
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    ProfilerPluginState.decode = function decode(reader, length) {
        if (!(reader instanceof $Reader))
            reader = $Reader.create(reader);
        var end = length === undefined ? reader.len : reader.pos + length, message = new $root.ProfilerPluginState();
        while (reader.pos < end) {
            var tag = reader.uint32();
            switch (tag >>> 3) {
            case 1: {
                    message.name = reader.string();
                    break;
                }
            case 2: {
                    message.state = reader.int32();
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
     * Decodes a ProfilerPluginState message from the specified reader or buffer, length delimited.
     * @function decodeDelimited
     * @memberof ProfilerPluginState
     * @static
     * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
     * @returns {ProfilerPluginState} ProfilerPluginState
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    ProfilerPluginState.decodeDelimited = function decodeDelimited(reader) {
        if (!(reader instanceof $Reader))
            reader = new $Reader(reader);
        return this.decode(reader, reader.uint32());
    };

    /**
     * Verifies a ProfilerPluginState message.
     * @function verify
     * @memberof ProfilerPluginState
     * @static
     * @param {Object.<string,*>} message Plain object to verify
     * @returns {string|null} `null` if valid, otherwise the reason why it is not
     */
    ProfilerPluginState.verify = function verify(message) {
        if (typeof message !== "object" || message === null)
            return "object expected";
        if (message.name != null && message.hasOwnProperty("name"))
            if (!$util.isString(message.name))
                return "name: string expected";
        if (message.state != null && message.hasOwnProperty("state"))
            switch (message.state) {
            default:
                return "state: enum value expected";
            case 0:
            case 1:
            case 2:
            case 3:
                break;
            }
        return null;
    };

    /**
     * Creates a ProfilerPluginState message from a plain object. Also converts values to their respective internal types.
     * @function fromObject
     * @memberof ProfilerPluginState
     * @static
     * @param {Object.<string,*>} object Plain object
     * @returns {ProfilerPluginState} ProfilerPluginState
     */
    ProfilerPluginState.fromObject = function fromObject(object) {
        if (object instanceof $root.ProfilerPluginState)
            return object;
        var message = new $root.ProfilerPluginState();
        if (object.name != null)
            message.name = String(object.name);
        switch (object.state) {
        default:
            if (typeof object.state === "number") {
                message.state = object.state;
                break;
            }
            break;
        case "INITED":
        case 0:
            message.state = 0;
            break;
        case "REGISTERED":
        case 1:
            message.state = 1;
            break;
        case "LOADED":
        case 2:
            message.state = 2;
            break;
        case "IN_SESSION":
        case 3:
            message.state = 3;
            break;
        }
        return message;
    };

    /**
     * Creates a plain object from a ProfilerPluginState message. Also converts values to other types if specified.
     * @function toObject
     * @memberof ProfilerPluginState
     * @static
     * @param {ProfilerPluginState} message ProfilerPluginState
     * @param {$protobuf.IConversionOptions} [options] Conversion options
     * @returns {Object.<string,*>} Plain object
     */
    ProfilerPluginState.toObject = function toObject(message, options) {
        if (!options)
            options = {};
        var object = {};
        if (options.defaults) {
            object.name = "";
            object.state = options.enums === String ? "INITED" : 0;
        }
        if (message.name != null && message.hasOwnProperty("name"))
            object.name = message.name;
        if (message.state != null && message.hasOwnProperty("state"))
            object.state = options.enums === String ? $root.ProfilerPluginState.State[message.state] === undefined ? message.state : $root.ProfilerPluginState.State[message.state] : message.state;
        return object;
    };

    /**
     * Converts this ProfilerPluginState to JSON.
     * @function toJSON
     * @memberof ProfilerPluginState
     * @instance
     * @returns {Object.<string,*>} JSON object
     */
    ProfilerPluginState.prototype.toJSON = function toJSON() {
        return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
    };

    /**
     * Gets the default type url for ProfilerPluginState
     * @function getTypeUrl
     * @memberof ProfilerPluginState
     * @static
     * @param {string} [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
     * @returns {string} The default type url
     */
    ProfilerPluginState.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
        if (typeUrlPrefix === undefined) {
            typeUrlPrefix = "type.googleapis.com";
        }
        return typeUrlPrefix + "/ProfilerPluginState";
    };

    /**
     * State enum.
     * @name ProfilerPluginState.State
     * @enum {number}
     * @property {number} INITED=0 INITED value
     * @property {number} REGISTERED=1 REGISTERED value
     * @property {number} LOADED=2 LOADED value
     * @property {number} IN_SESSION=3 IN_SESSION value
     */
    ProfilerPluginState.State = (function() {
        var valuesById = {}, values = Object.create(valuesById);
        values[valuesById[0] = "INITED"] = 0;
        values[valuesById[1] = "REGISTERED"] = 1;
        values[valuesById[2] = "LOADED"] = 2;
        values[valuesById[3] = "IN_SESSION"] = 3;
        return values;
    })();

    return ProfilerPluginState;
})();

$root.ProfilerPluginData = (function() {

    /**
     * Properties of a ProfilerPluginData.
     * @exports IProfilerPluginData
     * @interface IProfilerPluginData
     * @property {string|null} [name] ProfilerPluginData name
     * @property {number|null} [status] ProfilerPluginData status
     * @property {Uint8Array|null} [data] ProfilerPluginData data
     * @property {ProfilerPluginData.ClockId|null} [clockId] ProfilerPluginData clockId
     * @property {number|Long|null} [tvSec] ProfilerPluginData tvSec
     * @property {number|Long|null} [tvNsec] ProfilerPluginData tvNsec
     * @property {string|null} [version] ProfilerPluginData version
     * @property {number|null} [sampleInterval] ProfilerPluginData sampleInterval
     */

    /**
     * Constructs a new ProfilerPluginData.
     * @exports ProfilerPluginData
     * @classdesc Represents a ProfilerPluginData.
     * @implements IProfilerPluginData
     * @constructor
     * @param {IProfilerPluginData=} [properties] Properties to set
     */
    function ProfilerPluginData(properties) {
        if (properties)
            for (var keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                if (properties[keys[i]] != null)
                    this[keys[i]] = properties[keys[i]];
    }

    /**
     * ProfilerPluginData name.
     * @member {string} name
     * @memberof ProfilerPluginData
     * @instance
     */
    ProfilerPluginData.prototype.name = "";

    /**
     * ProfilerPluginData status.
     * @member {number} status
     * @memberof ProfilerPluginData
     * @instance
     */
    ProfilerPluginData.prototype.status = 0;

    /**
     * ProfilerPluginData data.
     * @member {Uint8Array} data
     * @memberof ProfilerPluginData
     * @instance
     */
    ProfilerPluginData.prototype.data = $util.newBuffer([]);

    /**
     * ProfilerPluginData clockId.
     * @member {ProfilerPluginData.ClockId} clockId
     * @memberof ProfilerPluginData
     * @instance
     */
    ProfilerPluginData.prototype.clockId = 0;

    /**
     * ProfilerPluginData tvSec.
     * @member {number|Long} tvSec
     * @memberof ProfilerPluginData
     * @instance
     */
    ProfilerPluginData.prototype.tvSec = $util.Long ? $util.Long.fromBits(0,0,true) : 0;

    /**
     * ProfilerPluginData tvNsec.
     * @member {number|Long} tvNsec
     * @memberof ProfilerPluginData
     * @instance
     */
    ProfilerPluginData.prototype.tvNsec = $util.Long ? $util.Long.fromBits(0,0,true) : 0;

    /**
     * ProfilerPluginData version.
     * @member {string} version
     * @memberof ProfilerPluginData
     * @instance
     */
    ProfilerPluginData.prototype.version = "";

    /**
     * ProfilerPluginData sampleInterval.
     * @member {number} sampleInterval
     * @memberof ProfilerPluginData
     * @instance
     */
    ProfilerPluginData.prototype.sampleInterval = 0;

    /**
     * Creates a new ProfilerPluginData instance using the specified properties.
     * @function create
     * @memberof ProfilerPluginData
     * @static
     * @param {IProfilerPluginData=} [properties] Properties to set
     * @returns {ProfilerPluginData} ProfilerPluginData instance
     */
    ProfilerPluginData.create = function create(properties) {
        return new ProfilerPluginData(properties);
    };

    /**
     * Encodes the specified ProfilerPluginData message. Does not implicitly {@link ProfilerPluginData.verify|verify} messages.
     * @function encode
     * @memberof ProfilerPluginData
     * @static
     * @param {IProfilerPluginData} message ProfilerPluginData message or plain object to encode
     * @param {$protobuf.Writer} [writer] Writer to encode to
     * @returns {$protobuf.Writer} Writer
     */
    ProfilerPluginData.encode = function encode(message, writer) {
        if (!writer)
            writer = $Writer.create();
        if (message.name != null && Object.hasOwnProperty.call(message, "name"))
            writer.uint32(/* id 1, wireType 2 =*/10).string(message.name);
        if (message.status != null && Object.hasOwnProperty.call(message, "status"))
            writer.uint32(/* id 2, wireType 0 =*/16).uint32(message.status);
        if (message.data != null && Object.hasOwnProperty.call(message, "data"))
            writer.uint32(/* id 3, wireType 2 =*/26).bytes(message.data);
        if (message.clockId != null && Object.hasOwnProperty.call(message, "clockId"))
            writer.uint32(/* id 4, wireType 0 =*/32).int32(message.clockId);
        if (message.tvSec != null && Object.hasOwnProperty.call(message, "tvSec"))
            writer.uint32(/* id 5, wireType 0 =*/40).uint64(message.tvSec);
        if (message.tvNsec != null && Object.hasOwnProperty.call(message, "tvNsec"))
            writer.uint32(/* id 6, wireType 0 =*/48).uint64(message.tvNsec);
        if (message.version != null && Object.hasOwnProperty.call(message, "version"))
            writer.uint32(/* id 7, wireType 2 =*/58).string(message.version);
        if (message.sampleInterval != null && Object.hasOwnProperty.call(message, "sampleInterval"))
            writer.uint32(/* id 8, wireType 0 =*/64).uint32(message.sampleInterval);
        return writer;
    };

    /**
     * Encodes the specified ProfilerPluginData message, length delimited. Does not implicitly {@link ProfilerPluginData.verify|verify} messages.
     * @function encodeDelimited
     * @memberof ProfilerPluginData
     * @static
     * @param {IProfilerPluginData} message ProfilerPluginData message or plain object to encode
     * @param {$protobuf.Writer} [writer] Writer to encode to
     * @returns {$protobuf.Writer} Writer
     */
    ProfilerPluginData.encodeDelimited = function encodeDelimited(message, writer) {
        return this.encode(message, writer).ldelim();
    };

    /**
     * Decodes a ProfilerPluginData message from the specified reader or buffer.
     * @function decode
     * @memberof ProfilerPluginData
     * @static
     * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
     * @param {number} [length] Message length if known beforehand
     * @returns {ProfilerPluginData} ProfilerPluginData
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    ProfilerPluginData.decode = function decode(reader, length) {
        if (!(reader instanceof $Reader))
            reader = $Reader.create(reader);
        var end = length === undefined ? reader.len : reader.pos + length, message = new $root.ProfilerPluginData();
        while (reader.pos < end) {
            var tag = reader.uint32();
            switch (tag >>> 3) {
            case 1: {
                    message.name = reader.string();
                    break;
                }
            case 2: {
                    message.status = reader.uint32();
                    break;
                }
            case 3: {
                    message.data = reader.bytes();
                    break;
                }
            case 4: {
                    message.clockId = reader.int32();
                    break;
                }
            case 5: {
                    message.tvSec = reader.uint64();
                    break;
                }
            case 6: {
                    message.tvNsec = reader.uint64();
                    break;
                }
            case 7: {
                    message.version = reader.string();
                    break;
                }
            case 8: {
                    message.sampleInterval = reader.uint32();
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
     * Decodes a ProfilerPluginData message from the specified reader or buffer, length delimited.
     * @function decodeDelimited
     * @memberof ProfilerPluginData
     * @static
     * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
     * @returns {ProfilerPluginData} ProfilerPluginData
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    ProfilerPluginData.decodeDelimited = function decodeDelimited(reader) {
        if (!(reader instanceof $Reader))
            reader = new $Reader(reader);
        return this.decode(reader, reader.uint32());
    };

    /**
     * Verifies a ProfilerPluginData message.
     * @function verify
     * @memberof ProfilerPluginData
     * @static
     * @param {Object.<string,*>} message Plain object to verify
     * @returns {string|null} `null` if valid, otherwise the reason why it is not
     */
    ProfilerPluginData.verify = function verify(message) {
        if (typeof message !== "object" || message === null)
            return "object expected";
        if (message.name != null && message.hasOwnProperty("name"))
            if (!$util.isString(message.name))
                return "name: string expected";
        if (message.status != null && message.hasOwnProperty("status"))
            if (!$util.isInteger(message.status))
                return "status: integer expected";
        if (message.data != null && message.hasOwnProperty("data"))
            if (!(message.data && typeof message.data.length === "number" || $util.isString(message.data)))
                return "data: buffer expected";
        if (message.clockId != null && message.hasOwnProperty("clockId"))
            switch (message.clockId) {
            default:
                return "clockId: enum value expected";
            case 0:
            case 1:
            case 2:
            case 3:
            case 4:
            case 5:
            case 6:
            case 7:
            case 8:
            case 9:
            case 10:
            case 11:
                break;
            }
        if (message.tvSec != null && message.hasOwnProperty("tvSec"))
            if (!$util.isInteger(message.tvSec) && !(message.tvSec && $util.isInteger(message.tvSec.low) && $util.isInteger(message.tvSec.high)))
                return "tvSec: integer|Long expected";
        if (message.tvNsec != null && message.hasOwnProperty("tvNsec"))
            if (!$util.isInteger(message.tvNsec) && !(message.tvNsec && $util.isInteger(message.tvNsec.low) && $util.isInteger(message.tvNsec.high)))
                return "tvNsec: integer|Long expected";
        if (message.version != null && message.hasOwnProperty("version"))
            if (!$util.isString(message.version))
                return "version: string expected";
        if (message.sampleInterval != null && message.hasOwnProperty("sampleInterval"))
            if (!$util.isInteger(message.sampleInterval))
                return "sampleInterval: integer expected";
        return null;
    };

    /**
     * Creates a ProfilerPluginData message from a plain object. Also converts values to their respective internal types.
     * @function fromObject
     * @memberof ProfilerPluginData
     * @static
     * @param {Object.<string,*>} object Plain object
     * @returns {ProfilerPluginData} ProfilerPluginData
     */
    ProfilerPluginData.fromObject = function fromObject(object) {
        if (object instanceof $root.ProfilerPluginData)
            return object;
        var message = new $root.ProfilerPluginData();
        if (object.name != null)
            message.name = String(object.name);
        if (object.status != null)
            message.status = object.status >>> 0;
        if (object.data != null)
            if (typeof object.data === "string")
                $util.base64.decode(object.data, message.data = $util.newBuffer($util.base64.length(object.data)), 0);
            else if (object.data.length >= 0)
                message.data = object.data;
        switch (object.clockId) {
        default:
            if (typeof object.clockId === "number") {
                message.clockId = object.clockId;
                break;
            }
            break;
        case "CLOCKID_REALTIME":
        case 0:
            message.clockId = 0;
            break;
        case "CLOCKID_MONOTONIC":
        case 1:
            message.clockId = 1;
            break;
        case "CLOCKID_PROCESS_CPUTIME_ID":
        case 2:
            message.clockId = 2;
            break;
        case "CLOCKID_THREAD_CPUTIME_ID":
        case 3:
            message.clockId = 3;
            break;
        case "CLOCKID_MONOTONIC_RAW":
        case 4:
            message.clockId = 4;
            break;
        case "CLOCKID_REALTIME_COARSE":
        case 5:
            message.clockId = 5;
            break;
        case "CLOCKID_MONOTONIC_COARSE":
        case 6:
            message.clockId = 6;
            break;
        case "CLOCKID_BOOTTIME":
        case 7:
            message.clockId = 7;
            break;
        case "CLOCKID_REALTIME_ALARM":
        case 8:
            message.clockId = 8;
            break;
        case "CLOCKID_BOOTTIME_ALARM":
        case 9:
            message.clockId = 9;
            break;
        case "CLOCKID_SGI_CYCLE":
        case 10:
            message.clockId = 10;
            break;
        case "CLOCKID_TAI":
        case 11:
            message.clockId = 11;
            break;
        }
        if (object.tvSec != null)
            if ($util.Long)
                (message.tvSec = $util.Long.fromValue(object.tvSec)).unsigned = true;
            else if (typeof object.tvSec === "string")
                message.tvSec = parseInt(object.tvSec, 10);
            else if (typeof object.tvSec === "number")
                message.tvSec = object.tvSec;
            else if (typeof object.tvSec === "object")
                message.tvSec = new $util.LongBits(object.tvSec.low >>> 0, object.tvSec.high >>> 0).toNumber(true);
        if (object.tvNsec != null)
            if ($util.Long)
                (message.tvNsec = $util.Long.fromValue(object.tvNsec)).unsigned = true;
            else if (typeof object.tvNsec === "string")
                message.tvNsec = parseInt(object.tvNsec, 10);
            else if (typeof object.tvNsec === "number")
                message.tvNsec = object.tvNsec;
            else if (typeof object.tvNsec === "object")
                message.tvNsec = new $util.LongBits(object.tvNsec.low >>> 0, object.tvNsec.high >>> 0).toNumber(true);
        if (object.version != null)
            message.version = String(object.version);
        if (object.sampleInterval != null)
            message.sampleInterval = object.sampleInterval >>> 0;
        return message;
    };

    /**
     * Creates a plain object from a ProfilerPluginData message. Also converts values to other types if specified.
     * @function toObject
     * @memberof ProfilerPluginData
     * @static
     * @param {ProfilerPluginData} message ProfilerPluginData
     * @param {$protobuf.IConversionOptions} [options] Conversion options
     * @returns {Object.<string,*>} Plain object
     */
    ProfilerPluginData.toObject = function toObject(message, options) {
        if (!options)
            options = {};
        var object = {};
        if (options.defaults) {
            object.name = "";
            object.status = 0;
            if (options.bytes === String)
                object.data = "";
            else {
                object.data = [];
                if (options.bytes !== Array)
                    object.data = $util.newBuffer(object.data);
            }
            object.clockId = options.enums === String ? "CLOCKID_REALTIME" : 0;
            if ($util.Long) {
                var long = new $util.Long(0, 0, true);
                object.tvSec = options.longs === String ? long.toString() : options.longs === Number ? long.toNumber() : long;
            } else
                object.tvSec = options.longs === String ? "0" : 0;
            if ($util.Long) {
                var long = new $util.Long(0, 0, true);
                object.tvNsec = options.longs === String ? long.toString() : options.longs === Number ? long.toNumber() : long;
            } else
                object.tvNsec = options.longs === String ? "0" : 0;
            object.version = "";
            object.sampleInterval = 0;
        }
        if (message.name != null && message.hasOwnProperty("name"))
            object.name = message.name;
        if (message.status != null && message.hasOwnProperty("status"))
            object.status = message.status;
        if (message.data != null && message.hasOwnProperty("data"))
            object.data = options.bytes === String ? $util.base64.encode(message.data, 0, message.data.length) : options.bytes === Array ? Array.prototype.slice.call(message.data) : message.data;
        if (message.clockId != null && message.hasOwnProperty("clockId"))
            object.clockId = options.enums === String ? $root.ProfilerPluginData.ClockId[message.clockId] === undefined ? message.clockId : $root.ProfilerPluginData.ClockId[message.clockId] : message.clockId;
        if (message.tvSec != null && message.hasOwnProperty("tvSec"))
            if (typeof message.tvSec === "number")
                object.tvSec = options.longs === String ? String(message.tvSec) : message.tvSec;
            else
                object.tvSec = options.longs === String ? $util.Long.prototype.toString.call(message.tvSec) : options.longs === Number ? new $util.LongBits(message.tvSec.low >>> 0, message.tvSec.high >>> 0).toNumber(true) : message.tvSec;
        if (message.tvNsec != null && message.hasOwnProperty("tvNsec"))
            if (typeof message.tvNsec === "number")
                object.tvNsec = options.longs === String ? String(message.tvNsec) : message.tvNsec;
            else
                object.tvNsec = options.longs === String ? $util.Long.prototype.toString.call(message.tvNsec) : options.longs === Number ? new $util.LongBits(message.tvNsec.low >>> 0, message.tvNsec.high >>> 0).toNumber(true) : message.tvNsec;
        if (message.version != null && message.hasOwnProperty("version"))
            object.version = message.version;
        if (message.sampleInterval != null && message.hasOwnProperty("sampleInterval"))
            object.sampleInterval = message.sampleInterval;
        return object;
    };

    /**
     * Converts this ProfilerPluginData to JSON.
     * @function toJSON
     * @memberof ProfilerPluginData
     * @instance
     * @returns {Object.<string,*>} JSON object
     */
    ProfilerPluginData.prototype.toJSON = function toJSON() {
        return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
    };

    /**
     * Gets the default type url for ProfilerPluginData
     * @function getTypeUrl
     * @memberof ProfilerPluginData
     * @static
     * @param {string} [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
     * @returns {string} The default type url
     */
    ProfilerPluginData.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
        if (typeUrlPrefix === undefined) {
            typeUrlPrefix = "type.googleapis.com";
        }
        return typeUrlPrefix + "/ProfilerPluginData";
    };

    /**
     * ClockId enum.
     * @name ProfilerPluginData.ClockId
     * @enum {number}
     * @property {number} CLOCKID_REALTIME=0 CLOCKID_REALTIME value
     * @property {number} CLOCKID_MONOTONIC=1 CLOCKID_MONOTONIC value
     * @property {number} CLOCKID_PROCESS_CPUTIME_ID=2 CLOCKID_PROCESS_CPUTIME_ID value
     * @property {number} CLOCKID_THREAD_CPUTIME_ID=3 CLOCKID_THREAD_CPUTIME_ID value
     * @property {number} CLOCKID_MONOTONIC_RAW=4 CLOCKID_MONOTONIC_RAW value
     * @property {number} CLOCKID_REALTIME_COARSE=5 CLOCKID_REALTIME_COARSE value
     * @property {number} CLOCKID_MONOTONIC_COARSE=6 CLOCKID_MONOTONIC_COARSE value
     * @property {number} CLOCKID_BOOTTIME=7 CLOCKID_BOOTTIME value
     * @property {number} CLOCKID_REALTIME_ALARM=8 CLOCKID_REALTIME_ALARM value
     * @property {number} CLOCKID_BOOTTIME_ALARM=9 CLOCKID_BOOTTIME_ALARM value
     * @property {number} CLOCKID_SGI_CYCLE=10 CLOCKID_SGI_CYCLE value
     * @property {number} CLOCKID_TAI=11 CLOCKID_TAI value
     */
    ProfilerPluginData.ClockId = (function() {
        var valuesById = {}, values = Object.create(valuesById);
        values[valuesById[0] = "CLOCKID_REALTIME"] = 0;
        values[valuesById[1] = "CLOCKID_MONOTONIC"] = 1;
        values[valuesById[2] = "CLOCKID_PROCESS_CPUTIME_ID"] = 2;
        values[valuesById[3] = "CLOCKID_THREAD_CPUTIME_ID"] = 3;
        values[valuesById[4] = "CLOCKID_MONOTONIC_RAW"] = 4;
        values[valuesById[5] = "CLOCKID_REALTIME_COARSE"] = 5;
        values[valuesById[6] = "CLOCKID_MONOTONIC_COARSE"] = 6;
        values[valuesById[7] = "CLOCKID_BOOTTIME"] = 7;
        values[valuesById[8] = "CLOCKID_REALTIME_ALARM"] = 8;
        values[valuesById[9] = "CLOCKID_BOOTTIME_ALARM"] = 9;
        values[valuesById[10] = "CLOCKID_SGI_CYCLE"] = 10;
        values[valuesById[11] = "CLOCKID_TAI"] = 11;
        return values;
    })();

    return ProfilerPluginData;
})();

module.exports = $root;
