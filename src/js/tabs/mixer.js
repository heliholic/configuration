'use strict';

TABS.mixer = {
    isDirty: false,
    needReboot: false,

    MIXER_CONFIG_dirty: false,
    MIXER_INPUTS_dirty: false,
    MIXER_RULES_dirty: false,

    MIXER_OVERRIDE_MIN: -2500,
    MIXER_OVERRIDE_MAX:  2500,
    MIXER_OVERRIDE_OFF:  2501,

    customConfig: false,

    swashType: 0,
    swashPhase: 0,
    swashTrim: [ 0, 0, 0 ],

    pitchRev: 0,
    rollRev: 0,
    collRev: 0,
    yawRev: 0,

    tailMode: 0,

    prevInputs: null,
    prevRules: null,

    showInputs: [ 1,2,4,3, ],
    showOverrides: [ 1,2,4,3, ],

    inputAttr: [
        { min:-1500, max:1500, step:10,   fixed:0, scale:1.000 },
        { min:-24,   max:24,   step:0.1,  fixed:1, scale:0.012 },
        { min:-24,   max:24,   step:0.1,  fixed:1, scale:0.012 },
        { min:-100,  max:100,  step:1,    fixed:0, scale:0.100 },
        { min:-24,   max:24,   step:0.1,  fixed:1, scale:0.012 },
    ],
    overrideAttr: [
        { min:-1500, max:1500, step:50,   fixed:0, scale:1.000 },
        { min:-18,   max:18,   step:0.1,  fixed:1, scale:0.012 },
        { min:-18,   max:18,   step:0.1,  fixed:1, scale:0.012 },
        { min:-100,  max:100,  step:1,    fixed:0, scale:0.100 },
        { min:-18,   max:18,   step:0.1,  fixed:1, scale:0.012 },
    ],
};

TABS.mixer.initialize = function (callback) {
    const self = this;

    load_data(load_html);

    function load_html() {
        $('#content').load("./tabs/mixer.html", process_html);
    }

    function load_data(callback) {
        MSP.promise(MSPCodes.MSP_STATUS)
            .then(() => MSP.promise(MSPCodes.MSP_FEATURE_CONFIG))
            .then(() => MSP.promise(MSPCodes.MSP_MIXER_CONFIG))
            .then(() => MSP.promise(MSPCodes.MSP_MIXER_INPUTS))
            .then(() => MSP.promise(MSPCodes.MSP_MIXER_RULES))
            .then(() => MSP.promise(MSPCodes.MSP_MIXER_OVERRIDE))
            .then(callback);
    }

    function save_data(callback) {
        function send_mixer_config() {
            if (self.MIXER_CONFIG_dirty)
                MSP.send_message(MSPCodes.MSP_SET_MIXER_CONFIG, mspHelper.crunch(MSPCodes.MSP_SET_MIXER_CONFIG), false, send_mixer_inputs);
            else
                send_mixer_inputs();
        }
        function send_mixer_inputs() {
            if (self.MIXER_INPUTS_dirty)
                mspHelper.sendMixerInputs(send_mixer_rules);
            else
                send_mixer_rules();
        }
        function send_mixer_rules() {
            //if (self.MIXER_RULES_dirty)
            //    mspHelper.sendMixerRules(save_eeprom);
            //else
                save_eeprom();
        }
        function save_eeprom() {
            if (self.MIXER_CONFIG_dirty || self.MIXER_INPUTS_dirty || self.MIXER_RULES_dirty)
                MSP.send_message(MSPCodes.MSP_EEPROM_WRITE, false, false, eeprom_saved);
            else
                save_done();
        }
        function eeprom_saved() {
            GUI.log(i18n.getMessage('eepromSaved'));
            save_done();
        }
        function save_done() {
            self.MIXER_CONFIG_dirty = false;
            self.MIXER_INPUTS_dirty = false;
            self.MIXER_RULES_dirty = false;
            self.isDirty = false;

            if (self.needReboot) {
                MSP.send_message(MSPCodes.MSP_SET_REBOOT);
                GUI.log(i18n.getMessage('deviceRebooting'));
                reinitialiseConnection(callback);
            }
            else {
                if (callback) callback();
            }
        }

        send_mixer_config();
    }

    function revert_data(callback) {
        function send_mixer_inputs() {
            if (self.MIXER_INPUTS_dirty)
                mspHelper.sendMixerInputs(send_mixer_rules);
            else
                send_mixer_rules();
        }
        function send_mixer_rules() {
            //if (self.MIXER_RULES_dirty)
            //    mspHelper.sendMixerRules(revert_done);
            //else
                revert_done();
        }
        function revert_done() {
            self.MIXER_INPUTS_dirty = false;
            self.MIXER_RULES_dirty = false;

            if (callback) callback();
        }

        send_mixer_inputs();
    }

    function add_override(inputIndex) {

        const mixerOverride = $('#tab-mixer-templates .mixerOverrideTemplate tr').clone();

        const mixerSlider = mixerOverride.find('.mixerOverrideSlider');
        const mixerEnable = mixerOverride.find('.mixerOverrideEnable input');
        const mixerInput  = mixerOverride.find('.mixerOverrideInput input');

        const attr = self.overrideAttr[inputIndex];

        mixerOverride.attr('class', `mixerOverride${inputIndex}`);
        mixerOverride.find('.mixerOverrideName').text(i18n.getMessage(Mixer.inputNames[inputIndex]));

        mixerInput.attr(attr);

        switch (inputIndex) {
            case 1:
            case 2:
            case 4:
            {
                mixerSlider.noUiSlider({
                    range: {
                        'min': -18,
                        'max':  18,
                    },
                    start: 0,
                    step: 1,
                    behaviour: 'snap-drag',
                });

                mixerOverride.find('.pips-range').noUiSlider_pips({
                    mode: 'values',
                    values: [ -18, -15, -12, -9, -6, -3, 0, 3, 6, 9, 12, 15, 18, ],
                    density: 100 / ((18 + 18) / 1),
                    stepped: true,
                    format: wNumb({
                        decimals: 0,
                    }),
                });
            }
            break;

            case 3:
            {
                mixerSlider.noUiSlider({
                    range: {
                        'min': -100,
                        'max':  100,
                    },
                    start: 0,
                    step: 5,
                    behaviour: 'snap-drag',
                });

                mixerOverride.find('.pips-range').noUiSlider_pips({
                    mode: 'values',
                    values: [ -100, -75, -50, -25, 0, 25, 50, 75, 100, ],
                    density: 100 / ((100 + 100) / 5),
                    stepped: true,
                    format: wNumb({
                        decimals: 0,
                    }),
                });
            }
            break;

            default:
            {
                mixerSlider.noUiSlider({
                    range: {
                        'min': -1500,
                        'max':  1500,
                    },
                    start: 0,
                    step: 50,
                    behaviour: 'snap-drag',
                });

                mixerOverride.find('.pips-range').noUiSlider_pips({
                    mode: 'values',
                    values: [ -1500, -1000, -500, 0, 500, 1000, 1500, ],
                    density: 100 / ((1500 + 1500) / 100),
                    stepped: true,
                    format: wNumb({
                        decimals: 0,
                    }),
                });
            }
            break;
        }

        mixerSlider.on('slide', function () {
            mixerInput.val(Number($(this).val()).toFixed(attr.fixed));
        });

        mixerSlider.on('change', function () {
            mixerInput.change();
        });

        mixerInput.change(function () {
            const value = $(this).val();
            mixerSlider.val(value);
            FC.MIXER_OVERRIDE[inputIndex] = Math.round(value / attr.scale);
            mspHelper.sendMixerOverride(inputIndex);
        });

        mixerEnable.change(function () {
            const check = $(this).prop('checked');
            const value = check ? 0 : self.MIXER_OVERRIDE_OFF;

            mixerInput.val(0);
            mixerSlider.val(0);

            mixerInput.prop('disabled', !check);
            mixerSlider.attr('disabled', !check);

            FC.MIXER_OVERRIDE[inputIndex] = value;
            mspHelper.sendMixerOverride(inputIndex);
        });

        let value = FC.MIXER_OVERRIDE[inputIndex];
        let check = (value >= self.MIXER_OVERRIDE_MIN && value <= self.MIXER_OVERRIDE_MAX);

        value *= attr.scale;
        value = (check ? value : 0).toFixed(attr.fixed);

        mixerInput.val(value);
        mixerSlider.val(value);

        mixerInput.prop('disabled', !check);
        mixerSlider.attr('disabled', !check);
        mixerEnable.prop('checked', check);

        $('.mixerOverride tbody').append(mixerOverride);
    }

    function data_to_form() {

        self.isDirty = false;
        self.needReboot = false;

        self.MIXER_CONFIG_dirty = false;
        self.MIXER_INPUTS_dirty = false;
        self.MIXER_RULES_dirty = false;

        //self.prevRules = Mixer.cloneRules(FC.MIXER_RULES);
        self.prevInputs = Mixer.cloneInputs(FC.MIXER_INPUTS);

        const mixerRuleOpers   = $('.mixerRuleTemplate #oper');
        const mixerRuleInputs  = $('.mixerRuleTemplate #input');
        const mixerRuleOutputs = $('.mixerRuleTemplate #output');

        Mixer.operNames.forEach(function(name,index) {
            mixerRuleOpers.append($(`<option value="${index}">` + i18n.getMessage(name)  + '</option>'));
        });
        Mixer.inputNames.forEach(function(name,index) {
            mixerRuleInputs.append($(`<option value="${index}">` + i18n.getMessage(name)  + '</option>'));
        });
        Mixer.outputNames.forEach(function(name,index) {
            mixerRuleOutputs.append($(`<option value="${index}">` + i18n.getMessage(name) + '</options>'));
        });

        if (!FC.CONFIG.mixerOverrideDisabled) {
            self.showOverrides.forEach(function(index) {
                add_override(index);
            });
        }

        $('.tab-mixer .override').toggle(!FC.CONFIG.mixerOverrideDisabled);

        $('.tab-mixer #mixerTailRotorMode').change(function () {
            const val = $(this).val();
            $('.tailRotorMotorized').toggle( val != 0 );
            $('.mixerBidirNote').toggle( val == 2 );
        });

        self.customConfig = false;

        self.customConfig |= (FC.MIXER_INPUTS[1].rate < 0);
        self.customConfig |= (FC.MIXER_INPUTS[3].rate < 0);

        self.customConfig |= (FC.MIXER_INPUTS[1].rate != FC.MIXER_INPUTS[2].rate &&
                              FC.MIXER_INPUTS[1].rate != -FC.MIXER_INPUTS[2].rate);

        self.customConfig |= (FC.MIXER_INPUTS[1].max !=  FC.MIXER_INPUTS[2].max);

        self.customConfig |= (FC.MIXER_INPUTS[1].max != -FC.MIXER_INPUTS[1].min);
        self.customConfig |= (FC.MIXER_INPUTS[2].max != -FC.MIXER_INPUTS[2].min);
        self.customConfig |= (FC.MIXER_INPUTS[4].max != -FC.MIXER_INPUTS[4].min);

        const pitchRev = (FC.MIXER_INPUTS[2].rate < 0) ? -1 : 1;
        const collRev = (FC.MIXER_INPUTS[4].rate < 0) ? -1 : 1;

        const collectiveRate = Math.abs(FC.MIXER_INPUTS[4].rate) / 10;
        const cyclicRate = Math.abs(FC.MIXER_INPUTS[1].rate) / 10;
        const yawRate = Math.abs(FC.MIXER_INPUTS[3].rate) / 10;

        const collectiveMax = FC.MIXER_INPUTS[4].max * 0.012;
        const cyclicMax = FC.MIXER_INPUTS[2].max * 0.012;
        const totalMax = FC.MIXER_CONFIG.swash_ring; // FIXME

        const yawScale = FC.MIXER_CONFIG.tail_rotor_mode ? 0.1 : 0.024;
        const yawMax = FC.MIXER_INPUTS[3].max * yawScale;
        const yawMin = FC.MIXER_INPUTS[3].min * yawScale;

        const mixerSwashType = $('.tab-mixer #mixerSwashType');

        Mixer.swashTypes.forEach(function(name,index) {
            mixerSwashType.append($(`<option value="${index}">` + i18n.getMessage(name) + '</option>'));
        });

        mixerSwashType.val(FC.MIXER_CONFIG.swash_type);

        $('.tab-mixer #mixerSwashRing').val(FC.MIXER_CONFIG.swash_ring).change();
        $('.tab-mixer #mixerSwashPhase').val(FC.MIXER_CONFIG.swash_phase).change();
        $('.tab-mixer #mixerElevatorPosition').val(pitchRev).change();
        $('.tab-mixer #mixerBladeGripControl').val(collRev).change();
        $('.tab-mixer #mixerMainRotorDirection').val(FC.MIXER_CONFIG.main_rotor_dir);

        $('.tab-mixer #mixerSwashTrim1').val(FC.MIXER_CONFIG.swash_trim[0]).change();
        $('.tab-mixer #mixerSwashTrim2').val(FC.MIXER_CONFIG.swash_trim[1]).change();
        $('.tab-mixer #mixerSwashTrim3').val(FC.MIXER_CONFIG.swash_trim[2]).change();

        $('.tab-mixer #mixerCyclicCalibration').val(cyclicRate).change();
        $('.tab-mixer #mixerCollectiveCalibration').val(collectiveRate).change();

        $('.tab-mixer #mixerCollectiveLimit').val(collectiveMax).change();
        $('.tab-mixer #mixerCyclicLimit').val(cyclicMax).change();
        $('.tab-mixer #mixerTotalPitchLimit').val(totalMax).change();

        $('.tab-mixer #mixerTailRotorMode').val(FC.MIXER_CONFIG.tail_rotor_mode).change();
        $('.tab-mixer #mixerTailRotorCalibration').val(yawRate).change();
        $('.tab-mixer #mixerTailRotorYawMin').val(yawMin).change();
        $('.tab-mixer #mixerTailRotorYawMax').val(yawMax).change();
        $('.tab-mixer #mixerTailMotorIdle').val(FC.MIXER_CONFIG.tail_motor_idle / 10).change();
    }

    function form_to_data() {

        FC.MIXER_CONFIG.swash_type = parseInt($('.tab-mixer #mixerSwashType').val());
        FC.MIXER_CONFIG.swash_ring = parseInt($('.tab-mixer #mixerSwashRing').val());
        FC.MIXER_CONFIG.swash_phase = parseInt($('.tab-mixer #mixerSwashPhase').val());

        FC.MIXER_CONFIG.main_rotor_dir = parseInt($('.tab-mixer #mixerMainRotorDirection').val());

        const pitchRev = $('.tab-mixer #mixerElevatorPosition').val();
        const collRev = $('.tab-mixer #mixerBladeGripControl').val();

        const collectiveRate = $('.tab-mixer #mixerCollectiveCalibration').val();
        const cyclicRate = $('.tab-mixer #mixerCyclicCalibration').val();

        const collectiveMax = $('.tab-mixer #mixerCollectiveLimit').val() / 0.012;
        const cyclicMax = $('.tab-mixer #mixerCyclicLimit').val() / 0.012;
        const totalMax = $('.tab-mixer #mixerTotalPitchLimit').val();

        FC.MIXER_INPUTS[1].rate = cyclicRate;
        FC.MIXER_INPUTS[1].min = -cyclicMax;
        FC.MIXER_INPUTS[1].max =  cyclicMax;

        FC.MIXER_INPUTS[2].rate = cyclicRate * pitchRev;
        FC.MIXER_INPUTS[2].min = -cyclicMax;
        FC.MIXER_INPUTS[2].max =  cyclicMax;

        FC.MIXER_INPUTS[4].rate = collectiveRate * collRev;
        FC.MIXER_INPUTS[4].min = -collectiveMax;
        FC.MIXER_INPUTS[4].max =  collectiveMax;

        FC.MIXER_CONFIG.swash_trim[0] = parseInt($('.tab-mixer #mixerSwashTrim1').val());
        FC.MIXER_CONFIG.swash_trim[1] = parseInt($('.tab-mixer #mixerSwashTrim2').val());
        FC.MIXER_CONFIG.swash_trim[2] = parseInt($('.tab-mixer #mixerSwashTrim3').val());

        FC.MIXER_CONFIG.tail_rotor_mode = parseInt($('.tab-mixer #mixerTailRotorMode').val());

        const yawScale = FC.MIXER_CONFIG.tail_rotor_mode ? 0.1 : 0.024;
        FC.MIXER_INPUTS[3].rate = $('.tab-mixer #mixerTailRotorCalibration').val() * 10;
        FC.MIXER_INPUTS[3].min = $('.tab-mixer #mixerTailRotorYawMin').val() / yawScale;
        FC.MIXER_INPUTS[3].max = $('.tab-mixer #mixerTailRotorYawMax').val() / yawScale;

        if (FC.MIXER_CONFIG.tail_rotor_mode) {
            FC.MIXER_CONFIG.tail_motor_idle = $('.tab-mixer #mixerTailMotorIdle').val() * 10;
        }

    }

    function process_html() {

        // translate to user-selected language
        i18n.localizePage();

        // UI Hooks
        data_to_form();

        // Hide the buttons toolbar
        $('.tab-mixer').addClass('toolbar_hidden');

        const saveBtn = $('.save_btn');
        const rebootBtn = $('.reboot_btn');

        function setDirty(reboot) {
            if (!self.isDirty) {
                self.isDirty = true;
                $('.tab-mixer').removeClass('toolbar_hidden');
            }
            if (reboot)
                self.needReboot = true;
            saveBtn.toggle(!self.needReboot);
            rebootBtn.toggle(self.needReboot);
        }

        $('.mixerConfigs').change(function () {
            self.MIXER_CONFIG_dirty = true;
            setDirty(true);
        });
        $('.mixerInputs').change(function () {
            self.MIXER_INPUTS_dirty = true;
            setDirty(false);
        });
        $('.mixerRules').change(function () {
            self.MIXER_RULES_dirty = true;
            setDirty(true);
        });

        self.save = function (callback) {
            form_to_data();
            save_data(callback);
        };

        self.revert = function (callback) {
            //if (self.MIXER_RULES_dirty)
            //    FC.MIXER_RULES = self.prevRules;
            if (self.MIXER_INPUTS_dirty)
                FC.MIXER_INPUTS = self.prevInputs;
            revert_data(callback);
        };

        $('a.save').click(function () {
            self.save(() => GUI.tab_switch_reload());
        });

        $('a.reboot').click(function () {
            self.save(() => GUI.tab_switch_reload());
        });

        $('a.revert').click(function () {
            self.revert(() => GUI.tab_switch_reload());
        });

         GUI.content_ready(callback);
    }
};

TABS.mixer.cleanup = function (callback) {
    this.isDirty = false;

    if (callback) callback();
};

