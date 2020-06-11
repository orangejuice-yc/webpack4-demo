import React, { Component } from 'react'
import intl from 'react-intl-universal'
import { Table, notification } from 'antd'
import style from './style.less'
import { connect } from 'react-redux'
import { changeLocaleProvider } from '../../../../../store/localeProvider/action'
import RightTags from '../../../../../components/public/RightTags/index'
import * as util from '../../../../../utils/util';
import * as dataUtil from '../../../../../utils/dataUtil';
import { getTaskChangeTreeByApplyId,getvariable } from '../../../../../api/api'
import axios from '../../../../../api/axios';

class Delivery extends Component {
    constructor(props) {
        super(props)
        this.state = {
            activeIndex: [],
            group: 2,
            rightData: [],
            data: [],
            initData: [],
            dataMap: [],
            projectId: null
        }
    }
    componentDidMount() {
        //监听全局点击事件
        document.addEventListener('click', this.closeRight);
        // 初始化数据
        this.initDatas();
    }

    /**
     * 初始化数据
     *
     */
    initDatas = () => {
        this.getTaskChangeTreeByBizs();
    }

    componentWillUnmount() {
        //销毁全局点击事件
        document.removeEventListener('click', this.closeRight, false);
    }

    // 获取选中的列表项
    getInfo = (record) => {
        let group = record.nodeType == "wbs" ? 1 :record.nodeType == "task"? 2 : -1;
        this.setState({
            activeIndex: [record.id],
            rightData: [record],
            group: group
        })
    }

    // 选中行高亮
    setClassName = (record) => {
        let activeId = this.state.activeIndex.length > 0 ? this.state.activeIndex[0] : -1;
        //判断索引相等时添加行的高亮样式
        return record.id === activeId ? "tableActivty" : "";
    }

    //获取项目交付物列表
    getTaskChangeTreeByBizs=()=>{
        const {formDatas } = this.props;
        if(formDatas && formDatas.length > 0){
          axios.post(getTaskChangeTreeByApplyId(formDatas[0].bizId)).then(res => {
            const { data } = res.data;
            let projectId = data[0].projectId;
            const dataMap = util.dataMap(data);
            axios.get(getvariable(projectId || 0), null, null, null, true).then(res=>{
                const variableData = res.data.data || {};
                this.setState({
                    data: data || [],
                    initData: data || [],
                    dataMap,
                    projSet: {
                        dateFormat: (variableData.dateFormat || {}).id || "YYYY-MM-DD",
                        drtnUnit: (variableData.drtnUnit || {}).id || "h",
                        timeUnit: (variableData.timeUnit || {}).id || "h",
                        complete: (variableData.complete || {}).id || "%",
                        precision: variableData.precision || 2,
                        moneyUnit: (variableData.currency || {}).symbol || "¥",
                        baseLineTime: variableData.baseLineTime
                      }
                  })
            })
          })
        }else{
          this.setState({
            data: [],
            initData: [],
            dataMap: {}
          })
        }
    }
    /**
     * 查询条件
     *
     * @param value
     */
    search = (value) => {
        const { initData } = this.state;
        let newData = dataUtil.search(initData, [{ "key": "name|code", "value": value }], true);
        const dataMap = util.dataMap(newData);
        this.setState({
            data: newData ,
            dataMap
        });
    }

    render() {
        const columns = [
          {
              title: intl.get('wsd.i18n.plan.feedback.name'),
              dataIndex: 'name',
              key: 'name',
              render: (text, record) => dataUtil.getIconCell(record.nodeType,text,record.taskType)
          },
          {
              title: intl.get('wsd.i18n.plan.feedback.code'),
              dataIndex: 'code',
              key: 'code',
          },
          {
            title: "变更类型",
            dataIndex: 'changeType',
            key: 'changeType',
            render: (text) => {
              return text && text.name;
            }
          },
          {
              title: intl.get('wsd.i18n.plan.feedback.planstarttime'),
              dataIndex: 'planStartTime',
              key: 'planStartTime',
              render: (text) =>  dataUtil.Dates().formatDateString(text)
          },
          {
              title: intl.get('wsd.i18n.plan.feedback.planendtime'),
              dataIndex: 'planEndTime',
              key: 'planEndTime',
              render: (text) =>  dataUtil.Dates().formatDateString(text)
          },
          {
              title: intl.get('wsd.i18n.plan.feedback.iptname'),
              dataIndex: 'org',
              key: 'org',
              render: data => data && data.name
          },
          {
              title: intl.get('wsd.i18n.plan.feedback.username'),
              dataIndex: 'user',
              key: 'user',
              render: data => data && data.name
          }
        ]
        return (
            <div className={style.main}>
                <div className={style.leftMain} style={{ height: this.props.height }}>
                    <div style={{ minWidth: 'calc(100vw - 60px)' }}>
                        <Table className={style.Infotable1}
                            columns={columns}
                            pagination={false}
                            dataSource={this.state.data}
                            rowClassName={this.setClassName}
                            rowKey={record => record.id}
                            defaultExpandAllRows={true}
                            size={"small"}
                            onRow={(record, index) => {
                                return {
                                    onClick: () => {
                                        this.getInfo(record, index)
                                    }
                                }
                            }} />
                    </div>
                </div>
                <div className={style.rightBox} style={{ height: this.props.height }}>
                    <RightTags
                        menuCode={this.props.menuInfo.menuCode}
                        groupCode={this.state.group}
                        editAuth={false}
                        rightTagList={this.state.rightTags}
                        rightData={this.state.rightData && this.state.rightData.length > 0 ? this.state.rightData : null}
                        getBaseSelectTree={this.getBaseSelectTree}
                        bizType="ST-SPECIAL-CHANGE"
                        bizId = {this.state.rightData && this.state.rightData.length > 0 ? this.state.rightData[0].id : null}
                        fileEditAuth = {false}
                        projectId={this.state.projectId}
                        projSet={this.state.projSet}
                        isCheckWf={false}
                    />
                </div>
            </div>
        )
    }
}


/* *********** connect链接state及方法 start ************* */
export default connect(state => ({
    currentLocale: state.localeProviderData
}), {changeLocaleProvider})(Delivery);

