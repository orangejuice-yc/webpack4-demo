import React, { Component } from 'react'
import style from './style.less'
import { Form, Row, Col, Input, Button, Icon, Select, DatePicker, Modal, message, Switch, TreeSelect, InputNumber } from 'antd';
import intl from 'react-intl-universal'
import moment from 'moment';
import '../../../../asserts/antd-custom.less'
import axios from '../../../../api/axios';
import * as dataUtil from "../../../../utils/dataUtil"
import {
  getdictTree,
  calendarList,
  caculateWorkHour,
  getAddInitData,
  defineOrgTree,
  getvariable,
} from '../../../../api/api';
import {
  checkTotalDesignWorkload
} from '../../../../api/suzhou-api';
const Option = Select.Option
const { TextArea } = Input;

export class PlanPreparedAddTask extends Component {
  constructor(props) {
    super(props)
    this.state = {
      info: {
        userId: null,
      },
      custom03:null,
      custom04:null,
      planLevelId:null,
      planTaskTypeList: [],
      defaultSecutyLevel: { value: "1", title: "非密" }, //默认密级
      planTypeList: {value: this.props.menuCode, title: (this.props.menuCode == "ST-IMPLMENT-TASK" ? "总体计划" : this.props.menuCode == "ST-IMPLMENT-Y-TASK" ? "年度计划" :"月度计划")},
      projSet: { dateFormat: 'YYYY-MM-DD', drtnUnit: 'h', timeUnit: 'h', precision: 2, moneyUnit: '¥' },
      _workTime: {},
      runnDone: true, //是否计算完成
    }
  }
  
  //开始计算
  startCaculate = () => {
    this.setState({ runnDone: false }) //标识计算开始
  }

  //计划日期工期计算(开始(修改)+工期=完成，完成(修改)-开始=工期，工期(修改)+开始=完成）
  caculateStartOrEndOrDrtn = (opeType, calendarId) => {
    let param = {
      calendarId: calendarId || this.props.form.getFieldValue("calendarId"),
      startTime: dataUtil.Dates().formatTimeString(this.props.form.getFieldValue("planStartTime")),
      endTime: dataUtil.Dates().formatTimeString(this.props.form.getFieldValue("planEndTime")),
      drtn: dataUtil.WorkTimes().toHour(this.props.form.getFieldValue("planDrtn"), this.state.projSet.drtnUnit, this.state._workTime.calendar),
      opeType: opeType
    }
    if (param.calendarId && (param.startTime || param.endTime)) {
      axios.post(caculateWorkHour, param).then(res => {
        const data = res.data.data || {};
        const workTime = { calendar: data.calendar, planStartTime: data.startTime, planEndTime: data.endTime, planDrtn: data.drtn, planQty: data.drtn };
        this.props.form.setFieldsValue({ ["planStartTime"]: dataUtil.Dates().formatTimeMonent(workTime.planStartTime) });
        this.props.form.setFieldsValue({ ["planEndTime"]: dataUtil.Dates().formatTimeMonent(workTime.planEndTime) });
        this.props.form.setFieldsValue({ ["planDrtn"]: dataUtil.WorkTimes().hourTo(workTime.planDrtn, this.state.projSet.drtnUnit, workTime.calendar) });
        this.props.form.setFieldsValue({ ["planQty"]: dataUtil.WorkTimes().hourTo(workTime.planQty, this.state.projSet.timeUnit, workTime.calendar) });
        this.setState({ _workTime: workTime, runnDone: true }) //标识计算完成
      })
    }
  }

  //开始(修改)+工期=完成
  caculateByStartTime = (status) => {
    if (status) {
      return; //只有关闭时才调用
    }
    const dateStart = dataUtil.Dates().formatTimeString(this.props.form.getFieldValue("planStartTime"));
    if (dateStart && this.state._workTime.planStartTime != dateStart) {
      this.caculateStartOrEndOrDrtn("StartTime");
    }
  }

  //完成(修改)-开始=工期
  caculateByEndTime = (status) => {
    if (status) {
      return; //只有关闭时才调用
    }
    const dateEnd = dataUtil.Dates().formatTimeString(this.props.form.getFieldValue("planEndTime"));
    if (dateEnd && this.state._workTime.planEndTime != dateEnd) {
      this.caculateStartOrEndOrDrtn("EndTime");
    }
  }

  //工期(修改)+开始=完成
  caculateByPlanDrtn = () => {
    const planDrtn = dataUtil.WorkTimes().toHour(this.props.form.getFieldValue("planDrtn"), this.state.projSet.drtnUnit, this.state._workTime.calendar);
    if (planDrtn > 0 && this.state._workTime.planDrtn != planDrtn) {
      this.caculateStartOrEndOrDrtn("Drtn");
    }
  }

  //日历(修改)=完成-开始=工期
  caculateByCalendar = (value, option) => {
    this.startCaculate()
    this.caculateStartOrEndOrDrtn("calendarId", value);
  }

  //工时(修改)
  caculateByPlanQty = () => {
    const planQty = dataUtil.WorkTimes().toHour(this.props.form.getFieldValue("planQty"), this.state.projSet.timeUnit, this.state._workTime.calendar);
    if (this.state._workTime.planQty != planQty) {
      let _workTime = this.state._workTime;
      _workTime.planQty = planQty;
      this.setState({ _workTime: _workTime, runnDone: true });
    }
  }

  // 获取任务信息
  getAddInitData = (defineId, parentId, projSet) => {
    axios.get(getAddInitData(defineId, parentId)).then(res => {
      const { keyType } = this.props;
      if (keyType != 1) {
        res.data.data.planDrtn = 0;
      }
      if (keyType == 2) {
        res.data.data.planEndTime = null;
      }
      if (keyType == 3) {
        res.data.data.planStartTime = null;
      }
      const { data } = res.data;
      const workTime = { ...data, planQty: data.planDrtn };
      const planDrtn = dataUtil.WorkTimes().hourTo(data.planDrtn, projSet.drtnUnit, workTime.calendar);
      const planQty = dataUtil.WorkTimes().hourTo(data.planDrtn, projSet.timeUnit, workTime.calendar);
      ;
      this.setState({
        projSet: projSet,
        _workTime: workTime,
        info: { ...data, planDrtn: planDrtn, planQty: planQty },
        orgList: res.data.data.org ? [{ value: res.data.data.org.id, title: res.data.data.org.name }] : null
      }, () => {
        const { info } = this.state
        if (info.org) {
          this.props.defineOrgUserList(info.org.id)
        }
      })
    })
  }

  changeDefineOrg = (orgid) => {
    this.props.form.setFieldsValue({ userId: null })
    this.props.defineOrgUserList(orgid)
  }

   // 初始化字典-计划-计划类型
  onCommUnitChange = () => {
    const {commUnit} = this.props
    if (!commUnit.length > 0) {
      this.props.getBaseSelectTree('comm.unit')
    }
  }

  // 初始化字典-计划-计划类型
  onPlanTypeChange = () => {
    const { planTypeData } = this.props
    if (planTypeData == null || !planTypeData.length > 0) {
      this.props.getBaseSelectTree('plan.define.plantype')
    }
  }

  // 初始化字典-计划-计划级别
  onPlanLevelChange = () => {
    const { planLevelData } = this.props
    if (planLevelData == null || !planLevelData.length > 0) {
      this.props.getBaseSelectTree('plan.task.planlevel')
    }
  }

  onCustom03Change = (value) =>{
    this.setState({
      custom03: value,
      custom04: value
    })
  }

  // 初始化字典-任务-作业类型
  // onPlanTaskTypeChange = () => {
  //     const { planTaskTypeList } = this.props
  //     if (!planTaskTypeList.length > 0) {
  //         this.props.getBaseSelectTree('plan.project.tasktype')
  //     }
  // }

  // 初始化字典-项目-工期类型
  onPlanTaskDrtnTypeChange = () => {
    const { planTaskDrtnTypeData } = this.props
    if (!planTaskDrtnTypeData.length > 0) {
      this.props.getBaseSelectTree('plan.project.taskdrtntype')
    }
  }

  //获取日历列表
  getCalendarList = () => {
    if (!this.state.calendarList) {
      axios.get(calendarList).then(res => {
        if (res.data.data) {
          this.setState({
            calendarList: res.data.data
          })
        }
      })
    }
  }

  //获取密级
  getSecutyLevelList = () => {
    if (!this.state.secutyLevelList) {
      axios.get(getdictTree("comm.secutylevel")).then(res => {
        if (res.data.data) {
          this.setState({
            secutyLevelList: res.data.data,
          })
        }
      })
    }
  }

  componentDidMount() {
    const {keyType,rightData,planLevelData} = this.props;
    if (planLevelData != null && planLevelData.length > 0) {
      planLevelData.map((v, i) => {
        if (i==0){
          this.setState({
            planLevelId: v.value
          })
        }
      })
    }
    keyType == 1 && this.setState({
      planTaskTypeList: [{ value: '1', title: '作业任务' }, { value: '4', title: '资源任务' }]
    })

    keyType == 2 && this.setState({
      planTaskTypeList: [{ value: '2', title: '开始里程碑' }]
    })

    keyType == 3 && this.setState({
      planTaskTypeList: [{ value: '3', title: '完成里程碑' }]
    })
    this.getProjSetInfo(rightData);
    this.getCalendarList();
  }

  getProjSetInfo = (rightData) => {
    axios.get(getvariable(this.props.rightData.projectId)).then(res => {
      // 
      const data = res.data.data || {};
      const projSet = {
        dateFormat: (data.dateFormat || {}).id || "YYYY-MM-DD",
        drtnUnit: (data.drtnUnit || {}).id || "h",
        timeUnit: (data.timeUnit || {}).id || "h",
        precision: data.precision || 2,
        moneyUnit: (data.currency || {}).symbol || "¥",
      }
      if (rightData) {
        if (rightData.nodeType == "define") {
          this.getAddInitData(rightData.defineId, 0, projSet);
        } else if (rightData.nodeType == "wbs") {
          this.getAddInitData(rightData.defineId, rightData.id, projSet);
        } else {
          this.getAddInitData(rightData.defineId, rightData.parentId, projSet);
        }
      }
    })
  }

  handleSubmit = (bol, e) => {
    const that = this
    if (this.state.runnDone) {
      e.preventDefault();
      this.props.form.validateFieldsAndScroll((err, values) => {
        if (!err) {
          const {rightData, keyType } = this.props
          const data = {
            ...values,
            custom01:this.props.year,
            custom02:this.props.month,
            projectId: rightData.projectId,
            defineId: rightData.defineId ? rightData.defineId : rightData.id,
            planStartTime: dataUtil.Dates().formatTimeString(values.planStartTime),
            planEndTime: dataUtil.Dates().formatTimeString(values.planEndTime),
            planDrtn: this.state._workTime.planDrtn,
            planQty: this.state._workTime.planQty,
            taskDrtnType: 'FixedDrtn',
            taskType : keyType,
            remark: values['remark'] || '',
          }
          let parentId = this.props.getParentId(true);
          axios.post(checkTotalDesignWorkload, { ...data, parentId }, false, null, true).then(res => {
            this.props.addPlanTask(data)
            if (!bol) {
              this.props.handleCancel()
            }
            this.props.form.resetFields();
            this.setState({
              custom03: null,
              custom04: null
            })
            const { info } = this.state
            if (info.org) {
              this.props.defineOrgUserList(info.org.id)
            }
          });
        }
      })
    } else {
      setTimeout(function () {
        that.handleSubmit(bol, e)
      }, 100)
    }
  }

  // 获取责任主体列表
  defineOrgTree = () => {
    const { rightData } = this.props;
    if (rightData.id) {
      axios.get(defineOrgTree(rightData.projectId)).then(res => {
        const { data } = res.data

        this.setState({
          orgTree: data ? data : [],
          orgList: null
        })
      })
    }
  }

  render() {
    const {
      getFieldDecorator,getFieldValue
    } = this.props.form;
    const formItemLayout = {
      labelCol: {
        xs: { span: 24 },
        sm: { span: 8 },
      },
      wrapperCol: {
        xs: { span: 24 },
        sm: { span: 16 },
      },
    };
    const formItemLayout1 = {
      labelCol: {
        xs: { span: 24 },
        sm: { span: 4 },
      },
      wrapperCol: {
        xs: { span: 24 },
        sm: { span: 20 },
      },
    };
    const { planLevelData, title, keyType,commUnit } = this.props
    return (
      <div className={style.main}>
        <Modal className={style.formMain} width="850px" centered={true}
          title={title} visible={true} onCancel={this.props.handleCancel} footer={
            <div className="modalbtn">
              <Button key="1" onClick={this.handleSubmit.bind(this, true)}>保存并继续</Button>
              <Button key="2" type="primary" onClick={this.handleSubmit.bind(this, false)}>保存</Button>
            </div>
          }>
          <Form onSubmit={this.handleSubmit}>
            <div className={style.content}>
              <Row gutter={24} type="flex">
                <Col span={11}>
                  <Form.Item
                    label={intl.get('wsd.i18n.base.planTemAddTask.name')} {...formItemLayout}>
                    {getFieldDecorator('taskName', {
                      initialValue: this.state.info.taskName,
                      rules: [{
                        required: true,
                        message: intl.get('wsd.i18n.message.enter') + intl.get('wsd.i18n.base.planTemAddTask.name'),
                      }],
                    })(
                      <Input maxLength={82} />
                    )}
                  </Form.Item>
                </Col>
                <Col span={11}>
                  <Form.Item
                    label={intl.get('wsd.i18n.base.planTemAddTask.code')} {...formItemLayout}>
                    {getFieldDecorator('taskCode', {
                      initialValue: this.state.info.taskCode,
                      rules: [{
                        required: true,
                        message: intl.get('wsd.i18n.message.enter') + intl.get('wsd.i18n.base.planTemAddTask.code'),
                      }],
                    })(
                      <Input maxLength={33} />
                    )}
                  </Form.Item>
                </Col>
              </Row>
              <Row gutter={24}>
                <Col span={11}>
                  <Form.Item label={intl.get('wsd.i18n.base.planTemAddTask.iptname')} {...formItemLayout}>
                    {getFieldDecorator('orgId', {
                      initialValue: this.state.info.org ? this.state.info.org.id : '',
                      rules: [{
                        required: true,
                        message: intl.get('wsd.i18n.message.enter') + intl.get('wsd.i18n.base.planTemAddTask.iptname')
                      }],
                    })(
                      <TreeSelect
                        dropdownStyle={{ maxHeight: 400, overflow: 'auto' }}
                        treeData={this.state.orgTree ? this.state.orgTree : this.state.orgList}
                        placeholder="请选择"
                        treeDefaultExpandAll
                        onFocus={this.defineOrgTree}
                        onChange={this.changeDefineOrg}
                      />
                    )}
                  </Form.Item>
                </Col>
                <Col span={11}>
                  <Form.Item
                    label={intl.get('wsd.i18n.base.planTemAddTask.username')} {...formItemLayout}>
                    {getFieldDecorator('userId', {
                      initialValue: this.state.info.user ? this.state.info.user.id : '',
                      rules: [],
                    })(
                      <Select>
                        {this.props.orgUserList.length ? this.props.orgUserList.map(item => {
                          return (
                            <Option key={item.id} value={item.id}> {item.title} </Option>
                          )
                        }) : this.state.info.user &&
                          <Option key={this.state.info.user.id} value={this.state.info.user.id}> {this.state.info.user.name} </Option>
                        }
                      </Select>
                    )}
                  </Form.Item>
                </Col>
              </Row>
              <Row gutter={24}>
                <Col span={11}>
                  <Form.Item
                    label={intl.get('wsd.i18n.base.planTemAddTask.planstarttime')} {...formItemLayout}>
                    {getFieldDecorator('planStartTime', {
                      initialValue: dataUtil.Dates().formatTimeMonent(this.state.info.planStartTime),
                      rules: [{
                        required: keyType != 3,
                        message: intl.get('wsd.i18n.message.enter') + intl.get('wsd.i18n.base.planTemAddTask.planstarttime'),
                      }],
                    })(
                      <DatePicker style={{ width: "100%" }} format={this.state.projSet.dateFormat}
                        showTime={{ format: 'HH:mm', defaultValue: moment('00:00:00', 'HH:mm:ss') }}
                        disabledDate={(current) => dataUtil.Dates().disabledMaxDate(current, this.props.form.getFieldValue("planEndTime"))}
                        disabledTime={(current) => dataUtil.Dates().disabledMaxDateTime(current, this.props.form.getFieldValue("planEndTime"))}
                        disabled={keyType == 3}
                        onChange={this.startCaculate}
                        onOpenChange={this.caculateByStartTime}
                      />
                    )}
                  </Form.Item>
                </Col>
                <Col span={11}>
                  <Form.Item
                    label={intl.get('wsd.i18n.base.planTemAddTask.planendtime')} {...formItemLayout}>
                    {getFieldDecorator('planEndTime', {
                      initialValue: dataUtil.Dates().formatTimeMonent(this.state.info.planEndTime),
                      rules: [{
                        required: keyType != 2,
                        message: intl.get('wsd.i18n.message.enter') + intl.get('wsd.i18n.base.planTemAddTask.planendtime'),
                      }],
                    })(
                      <DatePicker style={{ width: "100%" }} format={this.state.projSet.dateFormat}
                        showTime={{ format: 'HH:mm', defaultValue: moment('00:00:00', 'HH:mm:ss') }}
                        disabledDate={(current) => dataUtil.Dates().disabledMinDate(current, this.props.form.getFieldValue("planStartTime"))}
                        disabledTime={(current) => dataUtil.Dates().disabledMinDateTime(current, this.props.form.getFieldValue("planStartTime"))}
                        disabled={keyType == 2}
                        onChange={this.startCaculate}
                        onOpenChange={this.caculateByEndTime}
                      />
                    )}
                  </Form.Item>
                </Col>
              </Row>
              <Row gutter={24}>
                <Col span={11}>
                  <Form.Item label="日历" {...formItemLayout}>
                    {getFieldDecorator('calendarId', {
                      initialValue: this.state.info.calendar ? this.state.info.calendar.id : null,
                      rules: [{
                        required: true,
                        message: intl.get('wsd.i18n.message.enter') + intl.get('wsd.i18n.pre.project.projectname'),
                      }],
                    })(
                      <Select onChange={this.caculateByCalendar}>
                        {this.state.calendarList ? this.state.calendarList.map(item => {
                          return <Option value={item.id} key={item.id}>{item.calName}</Option>
                        }) : this.state.info.calendar &&
                          <Option value={this.state.info.calendar.id} key={this.state.info.calendar.id}>{this.state.info.calendar.calName}</Option>
                        }
                      </Select>
                    )}
                  </Form.Item>
                </Col>
                <Col span={11}>
                  <Form.Item label="计划工期" {...formItemLayout}>
                    {getFieldDecorator('planDrtn', {
                      initialValue: this.state.info.planDrtn,
                      rules: [{
                        required: keyType == 1,
                        message: intl.get('wsd.i18n.message.enter') + intl.get('wsd.i18n.plan.plandefine.planstarttime'),
                      }],
                    })(
                      <InputNumber style={{ width: '100%' }} max={999999999999} min={0} precision={this.state.projSet.precision}
                        formatter={value => `${value}` + this.state.projSet.drtnUnit}
                        parser={value => value.replace(this.state.projSet.drtnUnit, '')}
                        disabled={keyType == 2 || keyType == 3}
                        onChange={this.startCaculate}
                        onBlur={this.caculateByPlanDrtn}
                      />
                    )}
                  </Form.Item>
                </Col>
              </Row>
              <Row gutter={24}>
                <Col span={11}>
                  <Form.Item
                    label={intl.get('wsd.i18n.base.planTemAddTask.plantype')} {...formItemLayout}>
                    {getFieldDecorator('planType', {
                      initialValue:this.props.menuCode,
                      rules: [],
                    })(
                      <Select>
                        <Option value={this.state.planTypeList.value} key={this.state.planTypeList.value}>{this.state.planTypeList.title}</Option>
                      </Select>
                    )}
                  </Form.Item>
                </Col>
                <Col span={11}>
                  <Form.Item label="计划级别" {...formItemLayout}>
                    {getFieldDecorator('planLevel', {
                      initialValue: 'YB',
                      rules: [],
                    })(
                      <Select onFocus={this.onPlanLevelChange}>
                        {
                          planLevelData ? planLevelData.map((v, i) => {
                            return <Option value={v.value} key={i}>{v.title}</Option>
                          }): this.props.rightData.planLevel ?
                          <Option value={this.props.rightData.planLevel.id} key={this.props.rightData.planLevel.id}>{this.props.rightData.planLevel.name}</Option>
                          : null
                        }
                      </Select>
                    )}
                  </Form.Item>
                </Col>
              </Row>
              <Row gutter={24}>
                <Col span={11}>
                  <Form.Item label="设计总量" {...formItemLayout}>
                    {getFieldDecorator('custom03', {
                      initialValue: this.state.custom03,
                      rules: [],
                    })(
                      <InputNumber style={{ width: '100%' }} max={999999999999} min={0} onChange={this.onCustom03Change}/>
                    )}
                  </Form.Item>
                </Col>
                <Col span={11}>
                  <Form.Item label="计划完成量" {...formItemLayout}>
                    {
                      getFieldDecorator('custom04', {
                        initialValue: this.state.custom04,
                        rules: [],
                      })(
                      <InputNumber style={{ width: '100%' }} max={getFieldValue('custom03')} min={0}
                      />
                    )}
                  </Form.Item>
                </Col>
              </Row>
              <Row gutter={24}>
                <Col span={11}>
                    <Form.Item
                      label={intl.get('wsd.i18n.base.comm.unit')} {...formItemLayout}>
                      {getFieldDecorator('custom07', {
                        initialValue: this.state.info.custom07,
                        rules: [],
                      })(
                        <Select onFocus={this.onCommUnitChange}>
                          {
                            commUnit.map((v, i) => {
                              return <Option value={v.value} key={i}>{v.title}</Option>
                            })
                          }
                        </Select>
                      )}
                    </Form.Item>
                </Col>
                <Col span={11}>
                  <Form.Item label={intl.get('wsd.i18n.plan.subTask.custom06')} {...formItemLayout}>
                    {getFieldDecorator('custom06', {
                      initialValue: false,
                      valuePropName: 'checked',
                    })(
                      <Switch checkedChildren="是" unCheckedChildren="否"/>
                    )}
                  </Form.Item>
                </Col>
              </Row>
              <Row gutter={24}>
                <Col span={11}>
                  <Form.Item label={intl.get('wsd.i18n.base.planTemAddTask.estWt')} {...formItemLayout}>
                    {getFieldDecorator('estWt', {
                      initialValue: 1,
                      rules: [{
                        required: true,
                        message: intl.get('wsd.i18n.message.enter') + intl.get('wsd.i18n.base.planTemAddTask.estWt'),
                      }],
                    })(
                      <Input maxLength={82} />
                    )}
                  </Form.Item>
                </Col>
              </Row>
              <Row gutter={24}>
                <Col span={22}>
                  <Form.Item
                    label={intl.get('wsd.i18n.base.planTemAddTask.remark')} {...formItemLayout1}>
                    {getFieldDecorator('remark', {
                      initialValue: this.state.info.remark,
                      rules: [],
                    })(
                      <TextArea rows={4} maxLength={666} />
                    )}
                  </Form.Item>
                </Col>
              </Row>
            </div>
          </Form>
        </Modal>
      </div>
    )
  }
}

const PlanPreparedAddTasks = Form.create()(PlanPreparedAddTask);
export default PlanPreparedAddTasks
