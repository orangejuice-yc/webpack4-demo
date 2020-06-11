import React, {Component} from 'react'
import style from './style.less'
import {Form, Row, Col, Input, Button, Icon, Select, DatePicker, Modal, Switch, TreeSelect, InputNumber} from 'antd';
import intl from 'react-intl-universal'
import moment from 'moment'
import '../../../../asserts/antd-custom.less'
import axios from '../../../../api/axios';
import SubmitButton from "../../../../components/public/TopTags/SubmitButton"
import {
  calendarList,
  getdictTree,
  getproInfo,
  caculateWorkHour,
  getAddInitData,
  defineOrgTree,
  defineInfo,
  getvariable,
} from '../../../../api/api';
import * as dataUtil from '../../../../utils/dataUtil';

const Option = Select.Option
const {TextArea} = Input;

class PlanPreparedAddWbs extends Component {
  constructor(props) {
    super(props)
    this.state = {
      initOrg: true,
      info: {
        userId: null,
        newWbsFeedBack: 1,
        newControlAccount: 1
      },
      defaultSecutyLevel: {value: "1", title: "非密"}, //默认密级
      planTypeList: {value: "2", title: "专项计划"},
      projSet: {dateFormat: 'YYYY-MM-DD', drtnUnit: 'h', timeUnit: 'h', precision: 2, moneyUnit: '¥'},
      _workTime: {},
      runnDone: true, //是否计算完成
    }
  }

  //开始计算
  startCaculate = () => {
    this.setState({runnDone: false}) //标识计算开始
  }

  //计划日期工期计算(开始(修改)+工期=完成，完成(修改)-开始=工期，工期(修改)+开始=完成）
  caculateStartOrEndOrDrtn = (opeType, calendarId) => {
    let param = {
      calendarId: calendarId || this.props.form.getFieldValue("newCalendarId"),
      startTime: dataUtil.Dates().formatTimeString(this.props.form.getFieldValue("newPlanStartTime")),
      endTime: dataUtil.Dates().formatTimeString(this.props.form.getFieldValue("newPlanEndTime")),
      drtn: dataUtil.WorkTimes().toHour(this.props.form.getFieldValue("newPlanDrtn"), this.state.projSet.drtnUnit, this.state._workTime.calendar),
      opeType: opeType
    }
    if (param.calendarId && (param.startTime || param.endTime)) {
      axios.post(caculateWorkHour, param).then(res => {
        const data = res.data.data || {};
        const workTime = {calendar: data.calendar, planStartTime: data.startTime, planEndTime: data.endTime, planDrtn: data.drtn, planQty: data.drtn};
        this.props.form.setFieldsValue({["newPlanStartTime"]: dataUtil.Dates().formatTimeMonent(workTime.planStartTime)});
        this.props.form.setFieldsValue({["newPlanEndTime"]: dataUtil.Dates().formatTimeMonent(workTime.planEndTime)});
        this.props.form.setFieldsValue({["newPlanDrtn"]: dataUtil.WorkTimes().hourTo(workTime.planDrtn, this.state.projSet.drtnUnit, workTime.calendar)});
        this.props.form.setFieldsValue({["newPlanQty"]: dataUtil.WorkTimes().hourTo(workTime.planQty, this.state.projSet.timeUnit, workTime.calendar)});
        this.setState({_workTime: workTime, runnDone: true}) //标识计算完成
      })
    }
  }

  //开始(修改)+工期=完成
  caculateByStartTime = (status) => {
    if (status) {
      return; //只有关闭时才调用
    }
    const dateStart = dataUtil.Dates().formatTimeString(this.props.form.getFieldValue("newPlanStartTime"));
    if (dateStart && this.state._workTime.planStartTime != dateStart) {
      this.caculateStartOrEndOrDrtn("StartTime");
    }
  }

  //完成(修改)-开始=工期
  caculateByEndTime= () => {
    if (status) {
      return; //只有关闭时才调用
    }
    const dateEnd = dataUtil.Dates().formatTimeString(this.props.form.getFieldValue("newPlanEndTime"));
    if (dateEnd && this.state._workTime.planEndTime != dateEnd) {
      this.caculateStartOrEndOrDrtn("EndTime");
    }
  }

  //工期(修改)+开始=完成
  caculateByPlanDrtn = () => {
    const planDrtn = dataUtil.WorkTimes().toHour(this.props.form.getFieldValue("newPlanDrtn"), this.state.projSet.drtnUnit, this.state._workTime.calendar);
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
    const planQty = dataUtil.WorkTimes().toHour(this.props.form.getFieldValue("newPlanQty"), this.state.projSet.timeUnit, this.state._workTime.calendar);
    if (this.state._workTime.planQty != planQty) {
      let _workTime = this.state._workTime;
      _workTime.planQty = planQty;
      this.setState({ _workTime: _workTime, runnDone: true});
    }
  }

  // 获取任务信息
  getAddInitData = (defineId, parentId) => {
    axios.get(getvariable(this.props.rightData.projectId)).then(res => {
      const data = res.data.data || {};
      const projSet =  {
          dateFormat: (data.dateFormat || {}).id || "YYYY-MM-DD",
          drtnUnit: (data.drtnUnit || {}).id || "h",
          timeUnit: (data.timeUnit || {}).id || "h",
          precision: data.precision || 2,
          moneyUnit: (data.currency || {}).symbol || "¥",
      }
      axios.get(getAddInitData(defineId, parentId)).then(res => {
        const {data} = res.data

        const planDrtn = dataUtil.WorkTimes().hourTo(data.planDrtn, projSet.drtnUnit, data.calendar);
        const planQty = dataUtil.WorkTimes().hourTo(data.planDrtn, projSet.timeUnit, data.calendar);
        this.setState({info: {...data}})
        let org = data.org || [];
        this.setState({
          projSet: projSet,
          _workTime: {...data, planQty: data.planDrtn},
          defaultOrgTree: [{value: org.id, title: org.name}],
          info: {...data, planDrtn: planDrtn, planQty: planQty},
        }, () => {
          if (org) {
            this.props.defineOrgUserList(org.id)
          }
        });
      })
    })
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

  componentDidMount() {
    const {rightData} = this.props;
    if (rightData) {
      if (rightData.nodeType == "define") {
        this.getAddInitData(rightData.defineId, 0);
      } else {
        this.getAddInitData(rightData.defineId, rightData.id);
      }
    }
    this.getCalendarList();
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

  changeDefineOrg = (orgid) => {
    this.props.form.setFieldsValue({userId: null})
    if(orgid){
      this.props.defineOrgUserList(orgid)
    }
    
  }

  // 初始化字典-计划-计划类型
  onPlanTypeChange = () => {
    const {planTypeData} = this.props
    if (!planTypeData.length > 0) {
      this.props.getBaseSelectTree('plan.define.plantype')
    }
  }

  // 初始化字典-计划-计划级别
  onPlanLevelChange = () => {
    const {planLevelData} = this.props
    if (!planLevelData.length > 0) {
      this.props.getBaseSelectTree('plan.task.planlevel')
    }
  }

  handleSubmit = (bol) => {
    const that = this
    if(this.state.runnDone){
      this.props.form.validateFieldsAndScroll((err, values) => {
        if (!err) {
          const {projectIds, rightData, title} = this.props
          const data = {
            ...values,
            newWbsFeedBack: values.newWbsFeedBack ? 1 : 0,
            projectId: rightData.projectId,
            defineId: rightData.defineId ? rightData.defineId : rightData.id,
            newControlAccount: values.newControlAccount ? 1 : 0,
            newPlanStartTime: dataUtil.Dates().formatTimeString(values['newPlanStartTime']),
            newPlanEndTime: dataUtil.Dates().formatTimeString(values['newPlanEndTime']),
            newPlanDrtn: this.state._workTime.planDrtn,
            newPlanQty: this.state._workTime.planQty,
            // newPlanType: 0
          }
          this.props.addPlanWbs(data)
          this.props.form.resetFields()
          if (!bol) {
            this.props.handleCancel()
          }
        }
      })
    } else {
      setTimeout(function () {
        that.handleSubmit(bol, e)
      }, 100)
    }
  }

  defineOrgTree = (v) => {
    this.props.defineOrgTree(v);
    this.setState({initOrg: false});
  }

  render() {
    const {
      getFieldDecorator, getFieldsError, getFieldError, isFieldTouched,
    } = this.props.form;
    const formItemLayout = {
      labelCol: {
        xs: {span: 24},
        sm: {span: 8},
      },
      wrapperCol: {
        xs: {span: 24},
        sm: {span: 16},
      },
    };
    const formItemLayout1 = {
      labelCol: {
        xs: {span: 24},
        sm: {span: 4},
      },
      wrapperCol: {
        xs: {span: 24},
        sm: {span: 20},
      },
    };
    const {planTypeData, planLevelData, title} = this.props
    return (
      <div className={style.main}>
        <Modal className={style.formMain} width="850px" centered={true}  mask={false} maskClosable={false}
               title={title} visible={true} onCancel={this.props.handleCancel} footer={
          <div className="modalbtn">
            <SubmitButton key="1" onClick={this.handleSubmit.bind(this, true)} content="保存并继续" />
            <SubmitButton key="2" type="primary" onClick={this.handleSubmit.bind(this, false)} content="保存" />
          </div>
        }>
          <Form onSubmit={this.handleSubmit}>
            <div className={style.content}>
              <Row>
                <Col span={11}>
                  <Form.Item label={intl.get('wsd.i18n.base.planTemAddWBS.name')} {...formItemLayout}>
                    {getFieldDecorator('newName', {
                      initialValue: this.state.info.newName,
                      rules: [{
                        required: true,
                        message: intl.get('wsd.i18n.message.enter') + intl.get('wsd.i18n.base.planTemAddWBS.name'),
                      }],
                    })(
                      <Input maxLength={82}/>
                    )}
                  </Form.Item>
                </Col>
                <Col span={11}>
                  <Form.Item label={intl.get('wsd.i18n.base.planTemAddWBS.code')} {...formItemLayout}>
                    {getFieldDecorator('newCode', {
                      initialValue: this.state.info.taskCode,
                      rules: [{
                        required: true,
                        message: intl.get('wsd.i18n.message.enter') + intl.get('wsd.i18n.base.planTemAddWBS.code'),
                      }],
                    })(
                      <Input maxLength={33}/>
                    )}
                  </Form.Item>
                </Col>
              </Row>
              <Row>
                <Col span={11}>
                  <Form.Item
                    label={intl.get('wsd.i18n.base.planTemAddWBS.iptname')} {...formItemLayout}>
                    {getFieldDecorator('newOrgId', {
                      initialValue: this.state.info.org ? this.state.info.org.id : '',
                      rules: [{
                        required: true,
                        message: intl.get('wsd.i18n.message.select') + intl.get('wsd.i18n.base.planTemAddWBS.iptname'),
                      }],
                    })(
                      <TreeSelect
                      allowClear
                      showSearch     
                      treeNodeFilterProp="title"
                        dropdownStyle={{maxHeight: 400, overflow: 'auto'}}
                        treeData={this.state.initOrg ? this.state.defaultOrgTree : this.props.orgTree}
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
                    label={intl.get('wsd.i18n.base.planTemAddWBS.username')} {...formItemLayout}>
                    {getFieldDecorator('newUserId', {
                      initialValue: this.state.info.user ? this.state.info.user.id : '',
                      rules: [],
                    })(
                      <Select
                      allowClear
                      showSearch
                      optionFilterProp="children"
                      filterOption={(input, option) =>  option.props.children[1].toLowerCase().indexOf(input.toLowerCase()) >= 0}>
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
              <Row>
                <Col span={11}>
                  <Form.Item
                    label={intl.get('wsd.i18n.base.planTemAddWBS.planstarttime')} {...formItemLayout}>
                    {getFieldDecorator('newPlanStartTime', {
                      initialValue: this.state.info.planStartTime ? dataUtil.Dates().formatTimeMonent(this.state.info.planStartTime) : null,
                      rules: [{
                        required: true,
                        message: intl.get('wsd.i18n.message.select') + intl.get('wsd.i18n.base.planTemAddWBS.planstarttime'),
                      }],
                    })(
                      <DatePicker style={{width: "100%"}} format={this.state.projSet.dateFormat}
                                  showTime={{format: 'HH:mm', defaultValue: moment('00:00:00', 'HH:mm:ss')}}
                                  disabledDate={(current) => dataUtil.Dates().disabledMaxDate(current, this.props.form.getFieldValue("planEndTime"))}
                                  disabledTime={(current) => dataUtil.Dates().disabledMaxDateTime(current, this.props.form.getFieldValue("planEndTime"))}
                                  onChange={this.startCaculate}
                                  onOpenChange={this.caculateByStartTime}
                      />
                    )}
                  </Form.Item>
                </Col>
                <Col span={11}>
                  <Form.Item
                    label={intl.get('wsd.i18n.base.planTemAddWBS.planendtime')} {...formItemLayout}>
                    {getFieldDecorator('newPlanEndTime', {
                      initialValue: this.state.info.planEndTime ? dataUtil.Dates().formatTimeMonent(this.state.info.planEndTime) : null,
                      rules: [{
                        required: true,
                        message: intl.get('wsd.i18n.message.select') + intl.get('wsd.i18n.base.planTemAddWBS.planendtime'),
                      }],
                    })(
                      <DatePicker style={{width: "100%"}} format={this.state.projSet.dateFormat}
                                  showTime={{format: 'HH:mm', defaultValue: moment('00:00:00', 'HH:mm:ss')}}
                                  disabledDate={(current) => dataUtil.Dates().disabledMinDate(current, this.props.form.getFieldValue("planStartTime"))}
                                  disabledTime={(current) => dataUtil.Dates().disabledMinDateTime(current, this.props.form.getFieldValue("planStartTime"))}
                                  onChange={this.startCaculate}
                                  onOpenChange={this.caculateByEndTime}
                      />
                    )}
                  </Form.Item>
                </Col>
              </Row>
              <Row>
                <Col span={11}>
                  <Form.Item label={intl.get("wsd.i18n.pre.epsInfo.calnid")} {...formItemLayout}>
                    {getFieldDecorator('newCalendarId', {
                      initialValue: this.state.info.calendar ? this.state.info.calendar.id : null,
                      rules: [{
                        required: true,
                        message: intl.get('wsd.i18n.message.select') + intl.get('wsd.i18n.pre.epsInfo.calnid'),
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
                  <Form.Item
                    label={intl.get('wsd.i18n.base.planTemAddTask.plandrtn')} {...formItemLayout}>
                    {getFieldDecorator('newPlanDrtn', {
                      initialValue: this.state.info.planDrtn,
                      rules: [{
                        required: true,
                        message: intl.get('wsd.i18n.message.enter') + intl.get('wsd.i18n.base.planTemAddTask.plandrtn'),
                      }],
                    })(
                      <InputNumber style={{width: '100%'}} max={999999999999} min={0} precision={this.state.projSet.precision}
                                   formatter={value => `${value}` + this.state.projSet.drtnUnit}
                                   parser={value => value.replace(this.state.projSet.drtnUnit, '')}
                                   onChange={this.startCaculate}
                                   onBlur={this.caculateByPlanDrtn}
                      />
                    )}
                  </Form.Item>
                </Col>
              </Row>
              {/* <Row>
                <Col span={11}>
                  <Form.Item label="密级" {...formItemLayout}>
                    {getFieldDecorator('secutyLevel', {
                      initialValue: "1",
                      rules: [{
                        required: true,
                        message: intl.get('wsd.i18n.message.select') + "密级",
                      }],
                    })(
                      <Select onDropdownVisibleChange={this.getSecutyLevelList}>
                        {this.state.secutyLevelList ? this.state.secutyLevelList.map(item => {
                          return <Option value={item.value} key={item.value}>{item.title}</Option>
                        }) : this.state.defaultSecutyLevel &&
                          <Option value={this.state.defaultSecutyLevel.value} key={this.state.defaultSecutyLevel.value}>{this.state.defaultSecutyLevel.title}</Option>
                        }
                      </Select>
                    )}
                  </Form.Item>
                </Col>
                <Col span={11}>
                  <Form.Item
                    label={intl.get('wsd.i18n.base.planTemAddTask.planworkhours')} {...formItemLayout}>
                    {getFieldDecorator('newPlanQty', {
                      initialValue: this.state.info.planQty,
                      rules: [{
                        required: true,
                        message: intl.get('wsd.i18n.message.enter') + intl.get('wsd.i18n.base.planTemAddTask.planworkhours'),
                      }],
                    })(
                      <InputNumber style={{width: '100%'}} max={999999999999} min={0} precision={this.state.projSet.precision}
                                   formatter={value => `${value}` + this.state.projSet.timeUnit}
                                   parser={value => value.replace(this.state.projSet.timeUnit, '')}
                                   onChange={this.startCaculate}
                                   onBlur={this.caculateByPlanQty}
                      />
                    )}
                  </Form.Item>
                </Col>
              </Row> */}
              <Row>
                <Col span={11}>
                  <Form.Item label={intl.get('wsd.i18n.base.planTemAddWBS.plantype')} {...formItemLayout}>
                    {getFieldDecorator('newPlanType', {
                      initialValue: "2",
                      rules: [],
                    })(
                      <Select onFocus={this.onPlanTypeChange}>
                        {/* {
                          planTypeData.map((v, i) => {
                            return <Option value={v.value} key={i}>{v.title}</Option>
                          })
                        } */}
                        <Option value={this.state.planTypeList.value} key={this.state.planTypeList.value}>{this.state.planTypeList.title}</Option>
                      </Select>
                    )}
                  </Form.Item>
                </Col>
                <Col span={11}>
                  <Form.Item
                    label={intl.get('wsd.i18n.base.planTemAddWBS.planlevel')} {...formItemLayout}>
                    {getFieldDecorator('newPlanLevel', {
                      initialValue: this.state.info.planLevel,
                      rules: [],
                    })(
                      <Select onFocus={this.onPlanLevelChange}>
                        {
                          planLevelData.map((v, i) => {
                            return <Option value={v.value} key={i}>{v.title}</Option>
                          })
                        }
                      </Select>
                    )}
                  </Form.Item>
                </Col>
              </Row>
              <Row>
                <Col span={11}>
                  <Form.Item label={intl.get('wsd.i18n.base.planTemAddWBS.iswbsfb')} {...formItemLayout}>
                    {getFieldDecorator('newWbsFeedBack', {
                      initialValue: true ,
                      valuePropName: 'checked',
                    })(
                      <Switch checkedChildren="开" unCheckedChildren="关"/>
                    )}
                  </Form.Item>
                </Col>
                {/* <Col span={11}>
                  <Form.Item
                    label={intl.get('wsd.i18n.base.planTemAddWBS.isctrl')} {...formItemLayout}>
                    {getFieldDecorator('newControlAccount', {
                      initialValue: this.state.info.controlAccount == 1 ? true : false,
                      valuePropName: 'checked',
                    })(
                      <Switch checkedChildren="开" unCheckedChildren="关"/>
                    )}
                  </Form.Item>
                </Col> */}
              </Row>
              <Row>
                <Col span={22}>
                  <Form.Item label={intl.get('wsd.i18n.base.planTemAddWBS.remark')} {...formItemLayout1}>
                    {getFieldDecorator('newDesc', {
                      initialValue: this.state.info.remark,
                      rules: [],
                    })(
                      <TextArea rows={4} maxLength={666}/>
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

const PlanPreparedAddWbss = Form.create()(PlanPreparedAddWbs);
export default PlanPreparedAddWbss
