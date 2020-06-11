import React, { Component } from 'react'
import { Modal, message, notification, Icon } from 'antd';
import TopTags from './TopTags/index'
import RightTags from '../../../components/public/RightTags/index'
import style from './style.less'
import '../../../static/fonts/icon1/iconfont.js'
import * as dataUtil from '../../../utils/dataUtil'
import { connect } from 'react-redux'
import moment from "moment"
import axios from "../../../api/axios"
import TipModal from "../../Components/TipModal"
import {
  getPreparedTreeList,
  getuserauthtree,
  addPlanWbs,
  defineOrgTree,
  defineOrgUserList,
  getBaseSelectTree,
  addPlanTask,
  deletePlanTask,
  updatePlanTask,
  updatePlanWbs,
  batchaddwbs,
  getTaskEditAuth, getvariable, defineDel
} from "../../../api/api"
import ExtLayout from "../../../components/public/Layout/ExtLayout";
import MainContent from "../../../components/public/Layout/MainContent";
import Toolbar from "../../../components/public/Layout/Toolbar";
import Colum from '../Components/Colum'
import { getSectionIdsByDefineId } from '../../../api/suzhou-api'; //隐藏显示列

let gantt = null;
let GanttMenu = null;
let currentRow = null;
let progressLine = null
const confirm = Modal.confirm;

export class PlanPrepared extends Component {
  constructor(props) {
    super(props)
    this.state = {
      contentWidth: '',
      borderLeft: '',
      left: '',
      ganttHeight: '',
      currentData: {}, //选中行数据
      activeIndex: [],
      rightData: [],
      visible: false,
      selectArray: [],
      data: [],
      dataMap: [],
      orgTree: [],
      orgUserList: [],
      planTypeData: [],
      planLevelData: [],
      planTaskTypeData: [],
      planTaskDrtnTypeData: [],
      columState: false,
      ganttSetInfo: {},
      groupCode: 1,
      taskEditAuth: {},
      editAuth: false,
      cprtmEditAuth: false,
      taskReleaseAuth:false,
      taskCancleReleaseAuth:false,
      taskApprovalReleaseAuth:false,
      taskConfirmAuth:false,
      taskCancleConfirmAuth:false,
      tableListColors: {},
      showLine: false,
      baseLineTime: new Date(),
      projSet: { dateFormat: 'YYYY-MM-DD', drtnUnit: 'h', timeUnit: 'h', precision: 2, moneyUnit: '¥', complete: '%' },
      menusEdit: { wbs: { "1": false, "2": false }, task: { "1": false, "2": false, "3": false }, delete: { "1": false } },
      progressLineType: 1
    }
  }

  componentWillMount() {
    this.getBaseSelectTree("plan.task.planlevel");
    gantt = new CreateGantt();
    //进度线
    progressLine = new ProgressLine(gantt, {
      visible: false,
      getProjectDate: function () {
        return new Date();
      },
      getTaskDate: function (task) {

        if (task.Start && task.Finish && task.nodeType == 'task') {
          var time = task.Finish - task.Start;
          time = time * task.PercentComplete / 100;
          var date = new Date(task.Start.getTime() + time);
          return date;
        }
        //return task.Start;
      }

    });
    progressLine.setMode(this.state.progressLineType);
    gantt.setReadOnly(true);
    gantt.setGanttViewExpanded(false);
    GanttMenu = function () {
      GanttMenu.superclass.constructor.call(this);
    }

    mini.extend(GanttMenu, mini.Menu, {
      _create: function () {
        GanttMenu.superclass._create.call(this);
        var menuItems = [{
          type: "menuitem",
          iconCls: "icon-myaddwbs",
          text: mini.Gantt.Add_WBS,
          name: "addwbs"
        },
        {
          type: "menuitem",
          iconCls: "icon-myaddtask",
          text: mini.Gantt.Add_Task,
          name: "addtask"
        },
        {
          type: "menuitem",
          iconCls: "icon-mydel",
          text: mini.Gantt.Remove_Text,
          name: "remove"
        },
        {
          type: "menuitem",
          iconCls: "icon-myrefresh",
          text: mini.Gantt.Refresh,
          name: "refresh"
        },
          {
          	type: "menuitem",
          	iconCls: "icon-myexpansion",
          	text: mini.Gantt.Expansion,
          	name: "expansion"
          },
          // {
          // 	type: "menuitem",
          // 	iconCls: "icon-mycopy1",
          // 	text: mini.Gantt.Copy,
          // 	name: "copy"
          // },
          // {
          // 	type: "menuitem",
          // 	iconCls: "icon-mystick",
          // 	text: mini.Gantt.Stick,
          // 	name: "stick"
          // },
          // {
          // 	type: "menuitem",
          // 	iconCls: "icon-mychange1",
          // 	text: mini.Gantt.Wbs_To_Task,
          // 	name: "wbstotask"
          // },
          // {
          // 	type: "menuitem",
          // 	iconCls: "icon-mychange1",
          // 	text: mini.Gantt.Task_To_Wbs,
          // 	name: "tasktowbs"
          // },
        
          // {
          // 	type: "menuitem",
          // 	iconCls: "icon-myclose",
          // 	text: mini.Gantt.Close_Plan,
          // 	name: "closeplan"
          // },
          // {
          // 	type: "menuitem",
          // 	iconCls: "icon-myclumn",
          // 	text: mini.Gantt.ShowOrHide_colum,
          // 	name: "showOrHidecolum"
          // }
        ];
        this.setItems(menuItems);
        this.addwbs = mini.getbyName("addwbs", this);
        this.addtask = mini.getbyName("addtask", this);
        this.remove = mini.getbyName("remove", this);
        this.refresh = mini.getbyName("refresh", this);
        // this.copy = mini.getbyName("copy", this);
        // this.stick = mini.getbyName("stick", this);
        // this.tasktowbs = mini.getbyName("tasktowbs", this);
        // this.wbstotask = mini.getbyName("wbstotask", this);
        this.expansion = mini.getbyName("expansion", this);
        // this.closeplan = mini.getbyName("closeplan", this);
        // this.showOrHidecolum = mini.getbyName("showOrHidecolum", this);
        this.addwbs.on("click", this.__OnAddwbs, this);
        this.addtask.on("click", this.__OnAddtask, this);
        this.remove.on("click", this.__OnRemove, this);
        this.refresh.on("click", this.__refresh, this);
        // this.copy.on("click", this.__OnCopy, this);
        // this.stick.on("click", this.__OnStick, this);
        this.expansion.on("click", this.__OnExpansion, this);
        // this.closeplan.on("click", this.__OnCloseplan, this);
        // this.showOrHidecolum.on("click", this.__showOrHidecolum, this);
      },
      __OnAddwbs: this.addWbs,
      __OnAddtask: this.addTask,
      __OnRemove: this.removeRow,
      __refresh: this.initGantt,
      // __OnCopy: this.copyRow,
      // __OnStick: this.stickRow,
      __OnExpansion: this.expansion,
      // __OnCloseplan: this.closePlan,
      // __showOrHidecolum: this.showOrHidecolum
    });
  }

  // 右键执行添加下级WBS
  addWbs = () => {
    if (this.state.menusEdit["wbs"]["2"]) {
      this.topTagComponent.showAddWbsFormModal('WbssTopBtn', { key: 2 })
    } else {
      notification.warning(
        {
          placement: 'bottomRight',
          bottom: 50,
          duration: 2,
          message: '提示',
          description: '没有权限操作'
        }
      )
    }

  }

  // 右键执行添加任务
  addTask = () => {
    if (this.state.menusEdit["task"]["1"]) {
      this.topTagComponent.showAddTaskFormModal('TasksTopBtn', { key: 1 })
    } else {
      notification.warning(
        {
          placement: 'bottomRight',
          bottom: 50,
          duration: 2,
          message: '提示',
          description: '没有权限操作'
        }
      )
    }

  }

  // 右键删除
  removeRow = () => {

    if (this.state.menusEdit["delete"]["1"]) {
      this.setState({
        visible: !this.state.visible
      })
    } else {
      notification.warning(
        {
          placement: 'bottomRight',
          bottom: 50,
          duration: 2,
          message: '提示',
          description: '没有权限操作'
        }
      )
    }

  }

  // 右键复制
  copyRow = () => {
    currentRow = gantt.getSelected()
    if (currentRow) {
      notification.success(
        {
          placement: 'bottomRight',
          bottom: 50,
          duration: 2,
          message: '复制成功！',
          description: '成功复制所选行'
        }
      )
    }
  }

  // 右键粘贴
  stickRow = () => {

    const spreadData = {
      taskName: currentRow.name,
      taskCode: currentRow.code,
      orgId: currentRow.org ? currentRow.org.id : '',
      planStartTime: currentRow.planStartTime,
      planEndTime: currentRow.planEndTime,
      planDrtn: currentRow.planDrtn,
      planQty: currentRow.planQty,
      planType: currentRow.planType ? currentRow.planType.id : '',
      planLevel: currentRow.planLevel ? currentRow.planLevel.id : '',
      remark: currentRow.remark,
      projectId: currentRow.projectId,
      defineId: currentRow.defineId,
      taskType: currentRow.taskType
    }
    if (currentRow.nodeType == 'wbs') {
      const data = {
        ...spreadData,
        isFeedback: currentRow.feedbackStatus ? currentRow.feedbackStatus.id : '',
        controlAccount: currentRow.controlAccount
      }
      this.addPlanWbs(data, true)
      return
    }
    if (currentRow.nodeType == 'task') {
      const data = {
        ...spreadData,
        taskType: currentRow.taskType,
        drtnType: currentRow.drtnType
      }
      this.addPlanTask(data, true)
      return
    }
  }

  componentWillUnmount() {
    gantt = null;
  }

  // 右键展开
  expansion = () => {
    // gantt.expand(gantt.getSelected())
    gantt.expandAll();
  }

  // 右键删除确认弹窗
  handleOk = () => {
    this.setState({
      visible: !this.state.visible
    })
    this.topTagComponent.delete('DeleteTopBtn')
  }

  // 右键关闭计划
  closePlan = () => {
    gantt.collapse(gantt.getSelected())
  }

  // 右键隐藏/显示列
  showOrHidecolum = () => {
    this.setState({
      columState: true
    })
  }

  // 初始化数据
  initDatas = () => {
    dataUtil.CacheOpenProjectByType('specialTask').getLastOpenPlan((data) => {
      const { planId, projectId, projectName } = data;
      this.openPlan(planId, projectId, projectName);
    },'specialTask');
  }

  searchDatas = (params) => {
    this.setState({
      searchParams : params
    }, () => {
      this.initDatas();
    });
  }

  getVariableData = (projectId,callback) =>{
    axios.get(getvariable(projectId || 0)).then(res => {
      const data = res.data.data || {};
      callback(data);
    });
  }


  initGantt = () => {
    // 设置列
    this.setColumns();
    // 设置右键按钮及事件
    this.setGanttMenu();
    // 单击行事件
    this.onSelect();
    // //初始化横道颜色
    // this.initGanttColor();
    // 单元格设置
    this.drawcell();
    // 修复逻辑线对不上的问题
    this.updateLineTop();
    // this.saveGanttByStorage();
  };

  onSelect = () => {
    // 选中行设置选中行内容
    gantt.on('beforeselect', () => {
      const data = gantt.getSelected()
      this.getTaskEditAuth(data.defineId || 0, data.nodeType == 'wbs' || data.nodeType == "task" ? data.id : 0, data);
    })
  }

  /**
   *
   * @param defineId
   * @param taskId
   */
  getTaskEditAuth = (defineId, taskId, rightData) => {
    axios.get(getTaskEditAuth(defineId || 0, taskId || 0)).then(res => {
      const { data } = res.data || {};
      // 状态
      let status = data["status"];
      // 权限
      let auths = data["auths"];
      let edit = status == "EDIT" && auths && auths.indexOf("SPECIAL-TASK_EDIT") > -1;
      let cprtmEditAuth = auths && auths.indexOf("SPECIAL-TASK_EDIT") > -1;
      let taskReleaseAuth = auths && auths.indexOf("SPECIAL-TASK_RELEASE") > -1;
      let taskCancleReleaseAuth = auths && auths.indexOf("SPECIAL-TASK_RELEASE-CANCEL") > -1;
      let taskApprovalReleaseAuth = auths && auths.indexOf("SPECIAL-TASK_RELEASE-APRL") > -1;
      let taskConfirmAuth = auths && auths.indexOf("SPECIAL-TASK_CONFIRM") > -1;
      let taskCancleConfirmAuth = auths && auths.indexOf("SPECIAL-TASK_CONFIRM-CANCLE") > -1;
      this.setState({
        taskEditAuth: data,
        editAuth: edit,
        cprtmEditAuth,
        taskReleaseAuth,
        taskCancleReleaseAuth,
        taskApprovalReleaseAuth,
        taskConfirmAuth,
        taskCancleConfirmAuth,
        rightData: [rightData],
        groupCode: rightData.nodeType == 'task' ? 2 : rightData.nodeType == 'wbs' ? 1 : -1
      }, () => {
        const { auths, status } = (this.state.taskEditAuth || {});
        const { rightData } = this.state

        //根据计划定义id获取标段id
        if(rightData){
          axios.get(getSectionIdsByDefineId(defineId)).then(res => {
            this.setState({
              sectionId: res.data.data,
            })
          })
        }
        // Object.assign(this.state.menusEdit["wbs"], { "1": false, "2": false });
        // Object.assign(this.state.menusEdit["task"], { "1": false, "2": false, "3": false });
        // Object.assign(this.state.menusEdit["delete"], { "1": false });

        let menusEdit = { wbs: { "1": false, "2": false }, task: { "1": false, "2": false, "3": false }, delete: { "1": false } }
        switch (rightData[0].nodeType) {

          case 'project':
            this.setState({
              menusEdit
            })
            break;
          case 'define':

            if (auths && auths.indexOf("SPECIAL-TASK_EDIT") > -1) {
              // Object.assign(this.state.menusEdit["wbs"], { "2": true });
              // Object.assign(this.state.menusEdit["task"], { "1": true, "2": true, "3": true });
              menusEdit["wbs"]["2"] = true
              menusEdit["task"] = { "1": true, "2": true, "3": true }
            }
            this.setState({
              menusEdit
            })
            break;
          case 'wbs':
            if (auths) {

              if (auths.indexOf("SPECIAL-TASK_EDIT") > -1 && (status == "EDIT" || status == "CONFIRM")) {
                if (status == "EDIT") {
                  // Object.assign(this.state.menusEdit["delete"], { "1": true });
                  menusEdit["delete"] = { "1": true }
                }
                // Object.assign(this.state.menusEdit["wbs"], { "2": true });
                // Object.assign(this.state.menusEdit["task"], { "1": true, "2": true, "3": true });
                menusEdit["wbs"]["2"] = true
                menusEdit["task"] = { "1": true, "2": true, "3": true }
              }

              if (auths.indexOf("PLAN_TASK_ADD_BROTHER") > -1) {
                // Object.assign(this.state.menusEdit["wbs"], { "1": true });
                menusEdit["wbs"]["1"] = true
              }
            }
            this.setState({
              menusEdit
            })
            break;
          case 'task':

            if (auths) {

              if (auths.indexOf("SPECIAL-TASK_EDIT") > -1 && (status == "EDIT" || status == "CONFIRM")) {
                if (status == "EDIT") {
                  // Object.assign(this.state.menusEdit["delete"], { "1": true });
                  menusEdit["delete"] = { "1": true }
                }
              }
              if (auths.indexOf("PLAN_TASK_ADD_BROTHER") > -1) {
                // Object.assign(this.state.menusEdit["wbs"], { "1": true });
                // Object.assign(this.state.menusEdit["task"], { "1": true, "2": true, "3": true });
                menusEdit["wbs"]["1"] = true
                menusEdit["task"] = { "1": true, "2": true, "3": true }
              }
            }
            this.setState({
              menusEdit
            })
            break;
        }
      });
    });
  }

  setColumns = (showWbsPath) => {
    /* -------------以下进行自定义列------------- */
    let columns = []
    //String => 名称
    let ganttColumn = {
      name: "name",
      header: "名称<br/>String",
      field: "name",
      width: 280,
      editor: {
        type: "textbox"
      }
    };
    columns.push(ganttColumn);

    //String => 代码
    // let ganttColumn2 = {
    //   name: "code",
    //   header: "代码<br/>String",
    //   field: "code",
    //   width: 150,
    //   editor: {
    //     type: "textbox"
    //   }
    // };
    // columns.push(ganttColumn2);

    if(showWbsPath){
      let ganttWbsPathColumn = {
        name: "wbsPath",
        header: "WBS路径<br/>String",
        field: "wbsPath",
        width: 100,
        editor: {
          type: "textbox"
        }
      };
      columns.push(ganttWbsPathColumn);
    }

    //String => 责任主体
    let ganttColumn3 = {
      name: "org",
      header: "责任主体<br/>String",
      field: "orgName",
      width: 150,
      
      editor: {
        type: "textbox"
      }
    };
    columns.push(ganttColumn3);
    //String => 责任人
    let ganttColumn4 = {
      name: "user",
      header: "责任人<br/>String",
      field: "userName",
      width:150,
      editor: {
        type: "textbox"
      }
    };
    columns.push(ganttColumn4);
    //Date => 计划开始时间
    let ganttColumn5 = {
      name: "planStartTime",
      header: "计划开始时间<br/>Date",
      field: "planStartTime",
      width: 150,
      renderer: function (e) {
        var date = e.value;
        if (!date) return "";
        //return date.getFullYear() + "-" + (date.getMonth() + 1) + "-" + date.getDate();
        return date
      },
      editor: {
        type: "datepicker"
      }
    };
    columns.push(ganttColumn5);
    //Date => 计划完成时间
    let ganttColumn6 = {
      name: "planEndTime",
      header: "计划完成时间<br/>Date",
      field: "planEndTime",
      width: 150,
      renderer: function (e) {
        var date = e.value;
        if (!date) return "";
        //return date.getFullYear() + "-" + (date.getMonth() + 1) + "-" + date.getDate();
        return date
      },
      editor: {
        type: "datepicker"
      }
    };
    columns.push(ganttColumn6);

    let ganttColumn51 = {
      name: "actStartTime",
      header: "实际开始时间<br/>Date",
      field: "actStartTime",
      width: 150,
      renderer: function (e) {
        var date = e.value;
        if (!date) return "";
        //return date.getFullYear() + "-" + (date.getMonth() + 1) + "-" + date.getDate();
        return date
      },
      editor: {
        type: "datepicker"
      }
    };
    columns.push(ganttColumn51);
    let ganttColumn61 = {
      name: "actEndTime",
      header: "实际完成时间<br/>Date",
      field: "actEndTime",
      width: 150,
      renderer: function (e) {
        var date = e.value;
        if (!date) return "";
        //return date.getFullYear() + "-" + (date.getMonth() + 1) + "-" + date.getDate();
        return date
      },
      editor: {
        type: "datepicker"
      }
    };
    columns.push(ganttColumn61);
    let ganttColumn71 = {
      name: "completePct",
      header: "完成百分比<br/>String",
      field: "completePct",
      width: 100,
      editor: {
        type: "textbox"
      }
    };
    columns.push(ganttColumn71);
    //String => 计划工期
    let ganttColumn7 = {
      name: "planDrtn",
      header: "计划工期<br/>String",
      field: "planDrtn",
      width: 100,
      editor: {
        type: "textbox"
      }
    };
    columns.push(ganttColumn7);
    //String => 计划工时
    // let ganttColumn8 = {
    //   name: "planQty",
    //   header: "计划工时<br/>String",
    //   field: "planQty",
    //   width: 100,
    //   editor: {
    //     type: "textbox"
    //   }
    // };
    // columns.push(ganttColumn8);
    //String => 计划类型
    let ganttColumn11 = {
      name: "planType",
      header: "计划类型<br/>String",
      field: "planType",
      width: 100,
      editor: {
        type: "textbox"
      }
    };
    columns.push(ganttColumn11);
    //String => 计划级别
    let ganttColumn12 = {
      name: "planLevel",
      header: "计划级别<br/>String",
      field: "planLevel",
      width: 100,
      editor: {
        type: "textbox"
      }
    };
    columns.push(ganttColumn12);
    //String => 作业类型
    // let ganttColumn13 = {
    //   name: "taskType",
    //   header: "作业类型<br/>String",
    //   field: "taskType",
    //   width:100,
    //   editor: {
    //     type: "textbox"
    //   }
    // };
    // columns.push(ganttColumn13);
    // //String => 工期类型
    // let ganttColumn14 = {
    //   name: "taskDrtnType",
    //   header: "工期类型<br/>String",
    //   field: "taskDrtnType",
    //   width: 100,
    //   editor: {
    //     type: "textbox"
    //   }
    // };
    // columns.push(ganttColumn14);
    // //String => 发布人
    // let ganttColumn18 = {
    //   name: "releaseUser",
    //   header: "发布人<br/>String",
    //   field: "releaseUser",
    //   width: 100,
    //   editor: {
    //     type: "textbox"
    //   }
    // };
    // columns.push(ganttColumn18);
    // //Date => 发布日期
    // let ganttColumn19 = {
    //   header: "发布日期<br/>Date",
    //   field: "releaseTime",
    //   width: 150,
    //   renderer: function (e) {
    //     var date = e.value;
    //     if (!date) return "";
    //     //return date.getFullYear() + "-" + (date.getMonth() + 1) + "-" + date.getDate();
    //     return date
    //   },
    //   editor: {
    //     type: "datepicker"
    //   }
    // };
    // columns.push(ganttColumn19);
    //String => 计划状态
    let ganttColumn20 = {
      name: "status",
      header: "计划状态<br/>String",
      field: "status",
      width: 100,
      editor: {
        type: "textbox"
      }
    };
    columns.push(ganttColumn20);
    //String => 留空白，适应小屏幕行数据无法拉伸
    let ganttColumn21 = {
      name: "remark1",
      header: "",
      field: "remark1",
      width: 250,
      editor: {
        type: "textbox"
      }
    };
    columns.push(ganttColumn21);
    //将列集合数组设置给甘特图
    gantt.setColumns(columns);
    gantt.setTreeColumn("name");
  }

  drawcell = () => {
    let { tableListColors } = this.state;
    let thisObj = this;
    /* -------------自定义单元格开始------------- */
    gantt.on("drawcell", function (e) {
      let { projSet } = thisObj.state;
      if (tableListColors[e.record.level]) {
        e.rowStyle = `background:${tableListColors[e.record.level]}`
      }
      // else{
      // 	e.rowStyle = `background:none`
      // }
      let task = e.record, column = e.column, field = e.field;
      if (column.name == "name") {
        let icon = dataUtil.getIcon(task.nodeType, task.taskType);
        e.cellHtml = "<div title="+task.name+'><svg class="icon"  aria-hidden="true"><use xlink:href="#' + icon + '"></use></svg> ' + task.name+"</div>"
        return;
      }
      if (column.name == "code") e.cellHtml = task.code ? "<div title="+task.code+">"+task.code+"</div>" : ""
      if (column.name == "org") e.cellHtml = task.org ? "<div title="+task.org.name ? task.org.name : ''+">"+task.org.name ? task.org.name : ''+"</div>" : ""
      if (column.name == "user") e.cellHtml = task.user ? "<div title="+task.user.name+">"+task.user.name+"</div>" : ""
      if (column.name == "planType") e.cellHtml = task.planType ? task.planType.name : ""
      if (column.name == "planLevel") e.cellHtml = task.planLevel ? task.planLevel.name : ""
   
      if (column.name == "planStartTime") 
      e.cellHtml = task.planStartTime ?dataUtil.Dates().formatTimeString(task.planStartTime, projSet.dateFormat) : "" 
      if (column.name == "planEndTime") e.cellHtml = task.planEndTime ? dataUtil.Dates().formatTimeString(task.planEndTime, projSet.dateFormat) : ""
      if (column.name == "actStartTime") e.cellHtml = task.actStartTime ? dataUtil.Dates().formatTimeString(task.actStartTime, projSet.dateFormat) : ""
      if (column.name == "actEndTime") e.cellHtml = task.actEndTime ? dataUtil.Dates().formatTimeString(task.actEndTime, projSet.dateFormat) : ""
      if (column.name == "taskType") {
        switch (task.taskType) {
          case 1:
            e.cellHtml = "作业任务";
            break;
          case 2:
            e.cellHtml = "开始里程碑";
            break;
          case 3:
            e.cellHtml = "完成里程碑";
            break;
          case 4:
            e.cellHtml = "资源任务";
            break;
          default:
            e.cellHtml = "";
            break;
        }
      }
      if (task.calendar) {
        if (column.name == "planDrtn") e.cellHtml = task.planDrtn ? dataUtil.Numbers().fomat(dataUtil.WorkTimes().hourTo(task.planDrtn, projSet.drtnUnit, task.calendar)) + '天' : ''
        if (column.name == "planQty") e.cellHtml = task.planQty ? dataUtil.Numbers().fomat(dataUtil.WorkTimes().hourTo(task.planQty, projSet.timeUnit, task.calendar), { precision: projSet.precision }) + projSet.timeUnit : ''
      }
      if (column.name == "completePct") e.cellHtml = task.completePct ? dataUtil.WorkTimes().hourTo(task.completePct, projSet.complete, task.calendar) + projSet.complete : ''
      if (column.name == "taskDrtnType") e.cellHtml = task.taskDrtnType ? task.taskDrtnType.name : ''
      if (column.name == "releaseUser") e.cellHtml = task.releaseUser ? task.releaseUser.name : ''
      if (column.name == "status") e.cellHtml = task.status ? task.status.name : ''
    })
    /* -------------自定义单元格结束------------- */
  }

  setGanttMenu = () => {
    /* -------------创建右键菜单开始------------- */
    let menu = new GanttMenu()
    gantt.setContextMenu(menu)
    //监听菜单的opening事件，此事件在菜单显示前激发。可以控制菜单项的显示和可操作。
    menu.on("beforeopen", function (e) {
      let gantt = this.owner;       //PlusProject对象
      let task = gantt.getSelected();
      if (!task) {
        e.cancel = true;
        return;
      }
      //显示和可编辑所有菜单项
      this.addwbs.show();
      this.addtask.show();
      this.refresh.show();
      this.remove.show();
      // this.copy.show();
      // this.stick.show();
      // this.tasktowbs.show();
      // this.wbstotask.show();
      // this.expansion.show();
      // this.closeplan.show();
      // this.showOrHidecolum.show();
    });
    /* -------------创建右键菜单结束------------- */
  }

  componentDidMount() {
    const defaultGanttInfo = {
      stillNeedGantt: '#40cf00', //尚需横道
      actualGantt: '#76bbfd', //实际横道
      scheduleGantt: '#27d64a', //进度横道
      aimsGantt: '#e9c84a', //目标横道
      wbsGantt: '#66659b', //WBS横道
      ganttVisiable: [4], //1显示WBS横道 2显示计划横道 3显示基线横道 4显示关键路径
      topScale: 'year', //顶层刻度
      bottomScale: 'day' //底层刻度
    }
    let h = document.documentElement.clientHeight || document.body.clientHeight;   //浏览器高度，用于设置gantt高度作用
    let w = document.documentElement.clientWidth / 2 || document.body.clientWidth / 2; //右侧弹出框高度
    // 实例化gantt，将gantt赋值到state中，以便全局操作，获取gantt。
    gantt.setStyle("width:100%; height:100%;");
    gantt.setMultiSelect(false);
    //固定第一列
    gantt.frozenColumn(0, 0);
    this.setState({
      contentWidth: w - 41,
      borderLeft: w,
      left: w,
      ganttHeight: h - 200,
      ganttSetInfo: JSON.parse(localStorage.getItem('preparedganttSetInfo')) ? JSON.parse(localStorage.getItem('preparedganttSetInfo')) : defaultGanttInfo
    }, () => {
      gantt.render(document.getElementById('special-ganttCt'));
      gantt.setRowHeight(38) //gantt.rowHeight + 25
      // 开启只读模式
      gantt.setReadOnly(true);
      //是否允许拖拽
      // gantt.setAllowResize(false); //是否允许拖拽调整甘特图大小
      gantt.autoSyncSummary = false;
      this.applyGanttInfo();
      // 初始化数据
      // this.initDatas();
      // 初始化gantt属性
      this.initGantt();


    })
  }

  //应用甘特图设置
  applyGanttInfo = () => {
    const { ganttSetInfo } = this.state
    gantt.on("drawitem", function (e) {
      let itemBox = e.itemBox;
      let record = e.item;
      let isBaseLine = e.baseline;
      let h = itemBox.height;
      let top = itemBox.top;
      let left = itemBox.left;
      let right = itemBox.right;
      let w = right - left;
      if (w < 0) {
        return;
      }
      if (w < 2) w = 2;
      let boxModel = jQuery.boxModel;
      let percentComplete = record.PercentComplete || 0;
      let percentWidth = parseInt(w * percentComplete / 100);
      if (isBaseLine) percentWidth = 0;
      let cls = "mini-gantt-item ";
      if (isBaseLine) cls += " mini-gantt-baseline ";
      let html = "";
      if (record.nodeType != "task") {
        cls += "summary ";
        if (isBaseLine) {
          cls += " mini-gantt-baselinemilestone ";
          html = '<div id="' + record._id + '" class="' + cls + '" style="left:' + left + 'px;height:' + (4) + 'px;top:' + top + 'px;width:' + w + 'px;background:' + ganttSetInfo.aimsGantt + '"></div>';
        } else {
          html = '<div id="' + record._id + '" class="' + cls + ' mini-gantt-summary" style="left:' + left + 'px;top:' + top + 'px;width:' + w + 'px;background:' + ganttSetInfo.wbsGantt + '"><div class="mini-gantt-summary-left"></div><div class="mini-gantt-summary-right"></div></div>';
        }
      } else if (record.Milestone == 1) {
        cls += "milestone ";
        if (isBaseLine) {
          cls += " mini-gantt-baselinemilestone ";
          html = '<div id="' + record._id + '" class="' + cls + ' mini-gantt-milestone" style="left:' + left + 'px;top:' + top + 'px;"background:' + ganttSetInfo.aimsGantt + '"></div>';
        } else {
          if (record.Critical == 1) cls += " mini-gantt-critical ";
          html = '<div id="' + record._id + '" class="' + cls + ' mini-gantt-milestone" style="left:' + left + 'px;top:' + top + 'px;"background:' + ganttSetInfo.stillNeedGantt + '"></div>';
        }
      } else {

        if (isBaseLine) {
          cls += " mini-gantt-baselinemilestone ";
          html = '<div id="' + record._id + '" class="' + cls + '" style="left:' + left + 'px;top:' + top +
            'px;height:' + (4) + 'px;width:' + (boxModel ? w - 2 : w) +
            'px;background:' + ganttSetInfo.aimsGantt + '"></div>';
        } else {
          if (record.Critical == 1) cls += " mini-gantt-critical ";
          cls += "myitem ";
          html = '<div id="' + record._id + '" class="' + cls + '" style="left:' + left + 'px;top:' + top +
            'px;height:' + (boxModel ? h - 2 : h) + 'px;width:' + (boxModel ? w - 2 : w) +
            'px;background:' + ganttSetInfo.stillNeedGantt + '"><div class="mini-gantt-percentcomplete" style="width:' + percentWidth + 'px;background:' + ganttSetInfo.actualGantt + '"></div></div>';
        }
      }
      e.itemHtml = html;
    });
  }

  // 设定横道特定颜色
  setGanttColor = (key, value) => {
    const ganttSetInfo = typeof this.state.ganttSetInfo == 'string' ? JSON.parse(this.state.ganttSetInfo) : this.state.ganttSetInfo
    ganttSetInfo[key] = value
    this.setState({
      ganttSetInfo
    })
    localStorage.setItem("preparedganttSetInfo", JSON.stringify(ganttSetInfo))
  }

  // 将甘特图设置保存指localStorage
  saveGanttByStorage = (ganttSetInfo) => {


    //判断是否显示
    // 设置横道时间刻度
    gantt.setTopTimeScale(ganttSetInfo.topScale) //"year/halfyear/quarter/month/week/day/hour"
    gantt.setBottomTimeScale(ganttSetInfo.bottomScale)
    // gantt.setShowCritical(true)
    localStorage.setItem('preparedganttSetInfo', JSON.stringify(ganttSetInfo))

    this.setState({
      ganttSetInfo,
      showLine: ganttSetInfo.ganttVisiable.length > 0 && ganttSetInfo.ganttVisiable.indexOf('showLine') > -1 ? true : false
    }, () => {
      let data = gantt.getTaskTree()
      this.refreshGanttList(data)
    })
  }

  //设置table行颜色
  saveTableListColor = (tableListColors) => {
    this.setState({
      tableListColors
    }, () => {
      localStorage.setItem("tableListColors", JSON.stringify(tableListColors))
      this.drawcell()
      gantt.refresh()
    })
  }

  //恢复甘特图默认设置
  resetGanttColor = () => {
    localStorage.removeItem('preparedganttSetInfo')
    this.initGanttColor()
  }

  //恢复默认table行颜色
  resetTableColor = () => {
    localStorage.removeItem('tableListColors')
    this.setState({
      tableListColors: {}
    }, () => {
      this.drawcell()
    })
  }

  // 获取下拉框字典
  getBaseSelectTree = (typeCode) => {
    axios.get(getBaseSelectTree(typeCode)).then(res => {
      const { data } = res.data
      // 初始化字典-计划-计划类型
      if (typeCode == 'plan.define.plantype') {
        this.setState({
          planTypeData: data
        })
      }
      // 初始化字典-计划-计划级别
      if (typeCode == 'plan.task.planlevel') {
        this.setState({
          planLevelData: data
        })
      }
      // 初始化字典-任务-作业类型
      if (typeCode == 'plan.project.tasktype') {
        this.setState({
          planTaskTypeData: data
        })
      }
      // 初始化字典-项目-工期类型
      if (typeCode == 'plan.project.taskdrtntype') {
        this.setState({
          planTaskDrtnTypeData: data
        })
      }
    })
  }

  // 删除选中甘特图行
  deleteTask = () => {
    var task = gantt.getSelected();
    if (task) {
      confirm({
        title: '删除选中项',
        okText: '确定',
        cancelText: '取消',
        content: "确定删除计划 \"" + task.name + "\" ？",
        onOk() {
          gantt.removeTask(task);
          message.success('删除成功')
        },
        onCancel() {
        },
      });
    } else {
      message.warning('请选中计划')
    }
  }

  // 获取选择计划列表
  openPlan = (selectArray, projectId, projectName) => {

    this.getVariableData( projectId,(data) => {
      this.setState({
        selectArray: selectArray,
        selectProjectId: projectId,
        projectName: projectName,
        projSet: {
          dateFormat: (data.dateFormat || {}).id || "YYYY-MM-DD",
          drtnUnit: (data.drtnUnit || {}).id || "h",
          timeUnit: (data.timeUnit || {}).id || "h",
          complete: (data.complete || {}).id || "%",
          precision: data.precision || 2,
          moneyUnit: (data.currency || {}).symbol || "¥"
        },
        baseLineTime: data.baseLineTime
      }, () => {
        this.getPreparedTreeList(selectArray)
      })
    });
  }

  // 刷新甘特图列表
  refreshGanttList = (data) => {
    const { ganttSetInfo, projSet } = this.state
    let lineMode = ganttSetInfo.lineMode ? ganttSetInfo.lineMode : 1
    let showLine = ganttSetInfo.ganttVisiable.length > 0 && ganttSetInfo.ganttVisiable.indexOf('showLine') > -1 ? true : false
    let isShowBaseLine = ganttSetInfo.ganttVisiable.findIndex(item => item == 3 || item == 2) > -1
    let isPlanBaseline = ganttSetInfo.ganttVisiable.findIndex(item => item == 2) > -1
    let isBaseline = ganttSetInfo.ganttVisiable.findIndex(item => item == 3) > -1
    let lastStartTime = null;
    let lastEndTime = null;
    const loop = (value, level) => {
      for (let k = 0; k < value.length; k++) {
        let dat = value[k];
        let predecessorLinkList = dat['predecessorLink'];
        let newPredecessorLinkList = new Array();
        if (predecessorLinkList) {
          for (let j = 0, len = predecessorLinkList.length; j < len; j++) {
            let predecessorLink = predecessorLinkList[j];
            let newPredecessorLink = {};
            newPredecessorLink["TaskUID"] = predecessorLink["taskUID"];
            newPredecessorLink["LinkLag"] = predecessorLink["linkLag"];
            newPredecessorLink["LagFormat"] = predecessorLink["lagFormat"];
            newPredecessorLink["Type"] = predecessorLink["type"];
            newPredecessorLink["PredecessorUID"] = predecessorLink["predecessorUID"];
            newPredecessorLinkList.push(newPredecessorLink);
          }
        }
        // 如果是勾选了计划时间，BaseLine 取 planStartTime ...
        // 如果勾选了基线对比，BaseLine 取 blStartTime ...
        // 切换 对比类型（基线/计划）需要重算BaseLine
        if (lastStartTime) {
          if (dat['planStartTime'] < lastStartTime) {
            lastStartTime = dat['planStartTime']
          }
        } else {
          lastStartTime = dat['planStartTime']
        }
        if (lastEndTime) {
          if (dat['planEndTime'] > lastEndTime) {
            lastEndTime = dat['planEndTime']
          }
        } else {
          lastEndTime = dat['planEndTime']
        }

        let ps = dat['planStartTime']
        let pe = dat['planEndTime']
        let start = dat['actStartTime'] ? dat['actStartTime'] : dat['planStartTime']
        let end = dat['actEndTime'] ? dat['actEndTime'] :dat['planEndTime']
        Object.assign(value[k], {
          UID: dat['id'], //唯一标识
          Start: new Date(Date.parse(start.replace(/-/g, "/"))), //计划开始时间
          Finish: new Date(Date.parse(end.replace(/-/g, "/"))), //计划结束时间
          Name: dat['name'], //显示文字
          planStartTime: ps,
          planEndTime: pe,
          actStartTime: dat['actStartTime'],
          actEndTime: dat['actEndTime'],
          PercentComplete: dat['completePct'],
          PredecessorLink: newPredecessorLinkList,
          Summary: dat['nodeType'] == 'task' ? 0 : 1,
          Milestone: dat['taskType'] == 2 || dat['taskType'] == 3 ? 1 : 0,
          Critical: dat["critical"],
          level: level,
          Baseline: isShowBaseLine ? isBaseline ?
            [{ Start: dat['blStartTime'] ? new Date(dat['blStartTime']) : null, Finish: dat['blEndTime'] ? new Date(dat['blEndTime']) : null }] :
            [{ Start: dat['planStartTime'] ? new Date(dat['planStartTime']) : null, Finish: dat['planEndTime'] ? new Date(dat['planEndTime']) : null }] :
            null
        });
        if (dat.children) {
          loop(dat.children, level + 1);
        }
      }
    }
    loop(data, 1);
    this.setState({
      data
    });



    // 设置横道时间刻度
    gantt.setTopTimeScale(ganttSetInfo.topScale) //"year/halfyear/quarter/month/week/day/hour"
    gantt.setBottomTimeScale(ganttSetInfo.bottomScale)
    if (lastStartTime && lastEndTime) {
      gantt.allowProjectDateRange = true; //允许修改时间范围
      let minDate = new Date((new Date(lastStartTime)).getTime() - 24 * 60 * 60 * 1000 * 30)
      let maxDate = new Date((new Date(lastEndTime)).getTime() + 24 * 60 * 60 * 1000 * 300)
      if (ganttSetInfo.bottomScale == "month") {
        minDate = new Date((new Date(lastStartTime)).getTime() - 24 * 60 * 60 * 1000 * 30)
        maxDate = new Date((new Date(lastEndTime)).getTime() + 24 * 60 * 60 * 1000 * 300)

      }
      if (ganttSetInfo.bottomScale == "week") {
        minDate = new Date((new Date(lastStartTime)).getTime() - 24 * 60 * 60 * 1000 * 7)
        maxDate = new Date((new Date(lastEndTime)).getTime() + 24 * 60 * 60 * 1000 * 70)
        gantt.ganttView.bottomTimeScale.formatter = function (date) {
            //当时周时 ，修改底部刻度
            let firstDay = new Date(date.getFullYear(),0, 1);
            let dayOfWeek = firstDay.getDay(); 
            let spendDay= 1;
            if (dayOfWeek !=0) {
              spendDay=7-dayOfWeek+1;
            }
            firstDay = new Date(date.getFullYear(),0, 1+spendDay);
            let d =Math.ceil((date.valueOf()- firstDay.valueOf())/ 86400000);
            let result =Math.ceil(d/7);
            return result+1;
        }
    
      }
      if (ganttSetInfo.bottomScale == "day") {
        minDate = new Date((new Date(lastStartTime)).getTime() - 24 * 60 * 60 * 1000 * 1)
        maxDate = new Date((new Date(lastEndTime)).getTime() + 24 * 60 * 60 * 1000 * 10)

      }
      gantt.ganttView.setDateRange(minDate, maxDate)
    }
    this.setBaseLineTime();
    if (data){
      gantt.loadTasks([...data]);
    }
    gantt.unmask();



    if (isShowBaseLine) {
      gantt.setViewModel("track");
    } else {
      gantt.setViewModel("gantt");
    }
    progressLine.setVisible(showLine);
    progressLine.setMode(lineMode)
    gantt.doLayout();
    gantt.refresh();
  }

  updateLineTop = () => {
    let gap = 8;
    let getItemBox = mini.GanttView.prototype.getItemBox;
    mini.GanttView.prototype.getItemBox = function (item) {
      let box = getItemBox.apply(this, arguments);
      if (this.isMilestone(item) || this.isSummary(item)) {
      } else {
        //  let top = box.top - this.topOffset;
        //  box.top = top + gap;
        box.height = this.rowHeight - gap * 2;
      }
      return box;
    }
  }

  // 扩展甘特图特有字段
  spreadGanttData = (dat) => {
    const { ganttSetInfo, projSet } = this.state
    let isShowBaseLine = ganttSetInfo.ganttVisiable.findIndex(item => item == 3 || item == 2) > -1
    let isBaseline = ganttSetInfo.ganttVisiable.findIndex(item => item == 3) > -1
    /*let predecessorLinkList = dat['predecessorLink'];
    let newPredecessorLinkList = new Array();
    if (predecessorLinkList) {
      for (let j = 0, len = predecessorLinkList.length; j < len; j++) {
        let predecessorLink = predecessorLinkList[j];
        let newPredecessorLink = {};
        newPredecessorLink["TaskUID"] = predecessorLink["taskUID"];
        newPredecessorLink["LinkLag"] = predecessorLink["linkLag"];
        newPredecessorLink["LagFormat"] = predecessorLink["lagFormat"];
        newPredecessorLink["Type"] = predecessorLink["type"];
        newPredecessorLink["PredecessorUID"] = predecessorLink["predecessorUID"];
        newPredecessorLinkList.push(newPredecessorLink);
      }
    }*/
    // 如果是勾选了计划时间，BaseLine 取 planStartTime ...
    // 如果勾选了基线对比，BaseLine 取 blStartTime ...
    // 切换 对比类型（基线/计划）需要重算BaseLine
    let ps = dat['planStartTime']
    let pe = dat['planEndTime']
    let start = dat['actStartTime'] ? dat['actStartTime']: dat['planStartTime']
    let end = dat['actEndTime'] ? dat['actEndTime']: dat['planEndTime']
    const data = {
      ...dat, ...{
        UID: dat['id'], //唯一标识
        Start: new Date(Date.parse(start.replace(/-/g, "/"))), //计划开始时间
        Finish: new Date(Date.parse(end.replace(/-/g, "/"))), //计划结束时间
        Name: dat['name'], //显示文字
        planStartTime: ps,
        planEndTime: pe,
        actStartTime: dat['actStartTime'],
        actEndTime: dat['actEndTime'],
        PercentComplete: dat['completePct'],
        //PredecessorLink: newPredecessorLinkList,
        Summary: dat['nodeType'] == 'task' ? 0 : 1,
        Milestone: dat['taskType'] == 2 || dat['taskType'] == 3 ? 1 : 0,
        Critical: dat["critical"],
        Baseline: isShowBaseLine ? isBaseline ?
          [{ Start: dat['blStartTime'] ? new Date(dat['blStartTime']) : null, Finish: dat['blEndTime'] ? new Date(dat['blEndTime']) : null }] :
          [{ Start: dat['planStartTime'] ? new Date(dat['planStartTime']) : null, Finish: dat['planEndTime'] ? new Date(dat['planEndTime']) : null }] :
          null
      }
    }
    return data;
  }

  getSearchParams = () =>{
    let {searchParams} = this.state || {};
    let emptyValues = searchParams.emptyValues||[];
    let nullDelv = false, nullWbs = false, nullRsrc = false, nullUser = false;
    if(emptyValues){
      for(let i = 0, len = emptyValues.length; i < len; i++){
        if(emptyValues[i] == "wbs"){
          nullWbs = true;
        }else if(emptyValues[i] == "delv"){
          nullDelv = true;
        }else if(emptyValues[i] == "user"){
          nullUser = true;
        }else if(emptyValues[i] == "rsrc"){
          nullRsrc = true;
        }
      }
    }

    let ret = {
      ...searchParams,
      fuzzySearch : searchParams.fuzzySearch == undefined ||  searchParams.fuzzySearch == null || searchParams.fuzzySearch == "1",
      children : searchParams.children == undefined ||  searchParams.children == null || searchParams.children == "1",
      nullDelv,
      nullRsrc,
      nullWbs,
      nullUser
    }
    return ret;
  }

  // 获取计划编制列表
  getPreparedTreeList = (defineIds) => {
    // gantt.loading();
    const defineId = defineIds ? defineIds : this.state.selectArray;
    // 获取查询条件
    let searchParams = this.getSearchParams();

    // 只显示任务模式下，需要将WBS路径显示出来。
    this.setColumns(searchParams.onlyTask);

    // 将查询条件拼接到URL上，作为参数
    let url = dataUtil.spliceUrlParams(getPreparedTreeList,{... searchParams});
    // 查询计划编制
    axios.post(url, { defineIds: defineId }, null, null, true).then(res => {
      let { data } = res.data;
      this.refreshGanttList(data);
      this.setState({ rightData: [] });
    })
  }

  // 获取责任主体列表
  defineOrgTree = () => {
    const rightData = this.state.rightData[0]
    if (rightData.id) {

      axios.get(defineOrgTree(rightData.projectId)).then(res => {
        const { data } = res.data

        this.setState({
          orgTree: data ? data : []
        })
      })
    }
  }

  // 根据责任主体id获取责任人列表
  defineOrgUserList = (orgid) => {

    if (orgid) {
      axios.get(defineOrgUserList(orgid)).then(res => {
        this.setState({
          orgUserList: res.data.data
        })
      })
    }
  }

  // 添加WBS level: true为下级 false为同级
  addPlanWbs = (ndata, level) => {
    if (ndata) {
      const rightData = this.state.rightData[0];
      const parentTask = gantt.getParentTask(rightData)
      let parentId
      if (level) { //下级
        switch (rightData.nodeType) {
          case 'define':
            parentId = 0
            break;
          case 'wbs':
            parentId = rightData.id
            break;
          case 'task':
            parentId = rightData.parentId
            break;
          default:
            parentId = 0
        }
      } else {  //同级
        switch (rightData.nodeType) {
          case 'wbs':
            parentId = rightData.parentId
            //parentTask.nodeType == 'wbs' ? parentId = rightData.parentId : parentId = 0
            break;
          case 'task':
            parentId = rightData.parentId
            break;
          default:
            parentId = 0
        }
      }
      let url = dataUtil.spliceUrlParams(addPlanWbs, { "startContent": "项目【" + this.state.projectName + "】" });
      axios.post(url, { ...ndata, parentId }, true, null, true).then(res => {
        const { ganttSetInfo } = this.state
        if (level) {
          gantt.addTask(this.spreadGanttData(res.data.data), "add", rightData)
        } else {
          gantt.addTask(this.spreadGanttData(res.data.data), "after", rightData)
        }
      })
    }
  }
  //批量新增WBS
  batchAddWbs=(data)=>{
    const rightData = this.state.rightData[0];
    let parentId
    switch (rightData.nodeType) {
      case 'define':
        parentId = 0
        break;
      case 'wbs':
        parentId = rightData.id
        break;
      case 'task':
        parentId = rightData.parentId
        break;
      default:
        parentId = 0
    }
    let url = dataUtil.spliceUrlParams(batchaddwbs, { "startContent": "项目【" + this.state.projectName + "】" });
    axios.post(url,{ ...data, parentId },true,null,true).then(res=>{
        let array=res.data.data
        array.forEach(item=>{
          gantt.addTask(this.spreadGanttData(item), "add", rightData)
        })
    })
  }
  // 添加任务
  addPlanTask = (ndata) => {
    const rightData = this.state.rightData[0];
    const parentTask = gantt.getParentTask(rightData)
    let parentId
    if (rightData.nodeType == 'task') {
      parentId = rightData.parentId
    } else {
      if (rightData.nodeType == 'wbs') {
        parentId = rightData.id
      } else {
        parentId = 0
      }
    }
    let url = dataUtil.spliceUrlParams(addPlanTask, { "startContent": "项目【" + this.state.projectName + "】" });
    axios.post(url, { ...ndata, parentId }, true, null, true).then(res => {
      const { ganttSetInfo } = this.state
      if (rightData.nodeType == 'task') {
        gantt.addTask(this.spreadGanttData(res.data.data), "after", rightData)
      } else {
        gantt.addTask(this.spreadGanttData(res.data.data), "add", rightData)
      }
    })
  }

  // 删除WBS和任务
  deletePlanTask = () => {
    const { rightData } = this.state;
    let url = dataUtil.spliceUrlParams(deletePlanTask(rightData[0]['id']), { "startContent": "项目【" + this.state.projectName + "】" });
    axios.deleted(url, null, true).then(res => {
      gantt.removeTask(rightData[0])
      this.setState({
        rightData: []
      })
    })
  }

  // 修改WBS
  updatePlanWbs = (ndata) => {
    const selectdata = gantt.getSelected()
    let url = dataUtil.spliceUrlParams(updatePlanWbs, { "startContent": "项目【" + this.state.projectName + "】" });
    axios.put(url, ndata, true, null, true).then(res => {
      const { data } = res.data
      gantt.updateTask(selectdata, this.spreadGanttData(data))
    })
  }

  // 修改任务
  updatePlanTask = (ndata) => {
    const selectdata = gantt.getSelected()
    let url = dataUtil.spliceUrlParams(updatePlanTask, { "startContent": "项目【" + this.state.projectName + "】" });
    axios.put(url, ndata, true, null, true).then(res => {
      const { data } = res.data
      gantt.updateTask(selectdata, this.spreadGanttData(data))
    })
  }

  // 关闭隐藏/显示列弹窗
  handlePublicCancel = () => {

    //进度线
    progressLine = new ProgressLine(gantt, {
      visible: true
    });
    progressLine.setVisible(true);
    this.setState({
      columState: false
    })
  }

  // 设置显示隐藏列
  columHandle = (type, name) => {
    var column = gantt.getColumn(name);
    gantt.updateColumn(column, {
      visible: type
    });
  }
  /*甘特图无动态创建逻辑关系线*/
  addItem = (rowId, endTask) => {
    var link = { PredecessorUID: rowId, Type: 1 };
    gantt.addLink(endTask, link);
    gantt.fire("linkcreate", { link: link });
    // setUpTime();
  }

  /*甘特图页面无动态删除*/
  deleteItem = (linkArr) => {
    if (linkArr) {
      linkArr.forEach(link => {
        gantt.removeLink(link);
        gantt.fire("linkremove", { link: link });
      });
    }
  }

  refreshList = (data) => {
    this.refreshGanttList(data || []);
    this.setState({ rightData: [] });
  }

  setBaseLineTime_ = (baseTime) => {
    baseTime = baseTime || new Date();
    this.setState({ baseLineTime: baseTime }, () => {
      this.setBaseLineTime();
    });
  }

  setBaseLineTime = () => {
    let { baseLineTime } = this.state;
    baseLineTime = baseLineTime || new Date();
    let dataString = dataUtil.Dates().formatDateString(baseLineTime);
    baseLineTime = dataUtil.Dates().formatDateMonent(dataString);
    gantt.setTimeLines([
      { date: baseLineTime, text: "数据日期：" + dataString }
    ]);
  }

  getTaskByID = (taskId) => {
    return gantt.getTask(taskId);
  }
  //定位
  locationTask=(record)=>{
    let task=this.getTaskByID(record.taskId)
    this.getTaskEditAuth(task.defineId || 0, task.nodeType == 'wbs' || task.nodeType == "task" ? task.id : 0, task);
    gantt.select(task)
    gantt.scrollIntoView(task);
  }

  setContentWidth = (value) => {
    let {contentWidth,showLabels} = value || {};
    let height = this.getHeight();
    gantt.setStyle("width:"+contentWidth+"px;height:"+height+"px");
    if(showLabels){
      gantt.setShowGanttView(false);
    }else{
      gantt.setShowGanttView(true);
    }
    this.setState({contentWidth});
  }

  getHeight = () =>{
    //初始化css样式
    let h = document.documentElement.clientHeight || document.body.clientHeight;   //浏览器高度，用于设置组件高度
    return h - 190;
  }



  render() {
    const ganttHeight = this.getHeight()+"px";
    const { orgTree, rightData, orgUserList, planTypeData, planLevelData, selectArray, planTaskTypeData, planTaskDrtnTypeData, selectProjectId, menusEdit, taskEditAuth } = this.state;

    let rdata = rightData && rightData.length > 0 ? rightData[0] : {};
    let startContent = "项目【" + this.state.projectName + "】，" + (rdata.nodeType == "wbs" ? "WBS" : rdata.taskType == 1 || rdata.taskType == 4 ? "任务" : "里程碑") + "【" + rdata.name + "】";

    return (

      <ExtLayout renderWidth = {(value) => { this.setContentWidth(value); }}>
        <Toolbar>
          <TopTags
            openPlan={this.openPlan} //选择计划列表
            defineOrgTree={this.defineOrgTree} //获取责任主体列表
            orgTree={orgTree}
            defineIds={selectArray}
            selectProjectId={selectProjectId}
            selectProjectName={this.state.projectName}
            defineOrgUserList={this.defineOrgUserList} //根据责任主体id获取责任人列表
            orgUserList={orgUserList}
            rightData={rightData.length ? rightData[0] : {}}
            getBaseSelectTree={this.getBaseSelectTree} //获取下拉框字典
            planTypeData={planTypeData}
            planLevelData={planLevelData}
            planTaskTypeData={planTaskTypeData}
            planTaskDrtnTypeData={planTaskDrtnTypeData}
            addPlanWbs={this.addPlanWbs} //添加WBS
            addPlanTask={this.addPlanTask} //添加任务
            batchAddWbs={this.batchAddWbs}//批量新增WBS
            deletePlanTask={this.deletePlanTask} //删除任务
            onRef={(node) => this.topTagComponent = node}
            ganttSetInfo={this.state.ganttSetInfo}
            setGanttColor={this.setGanttColor}
            saveGanttByStorage={this.saveGanttByStorage}
            resetGanttColor={this.resetGanttColor}
            resetTableColor={this.resetTableColor}
            getPreparedTreeList={this.getPreparedTreeList}
            menusEdit={menusEdit}
            refreshList={this.refreshList}
            initDatas={this.initDatas}
            searchDatas = {this.searchDatas }
            data={this.state.data}
            tableListColors={this.state.tableListColors}
            saveTableListColor={this.saveTableListColor}
            baseLineTime={this.state.baseLineTime}
            setBaseLineTime={this.setBaseLineTime_}
            locationTask={this.locationTask}
            menuCode={this.props.menuInfo.menuCode}
            taskReleaseAuth={this.state.taskReleaseAuth}
            taskCancleReleaseAuth= {this.state.taskCancleReleaseAuth}
            taskApprovalReleaseAuth={this.state.taskApprovalReleaseAuth}
            taskConfirmAuth={this.state.taskConfirmAuth}
            taskCancleConfirmAuth={this.state.taskCancleConfirmAuth}
          />
        </Toolbar>
        <MainContent contentWidth = {this.state.contentWidth} contentMinWidth = {1500}>
          <div className="miniFit" style={{ height: this.state.ganttHeight, minWidth: 'calc(100vw - 60px)' }}>
            <div ref="ganttCt" id="special-ganttCt" style={{ width: '100%', height: ganttHeight }}></div>
          </div>
        </MainContent>
        <RightTags
          //用于查询流程信息页签
          bizType = 'task'
          bizId={rightData.length && rightData.length > 0 ? rightData[0].id : null}
          projectId={selectProjectId}
          rightData={rightData.length ? rightData : null}
          data={rightData.length ? rightData[0] : null}
          getBaseSelectTree={this.getBaseSelectTree} //获取下拉框字典
          updatePlanWbs={this.updatePlanWbs}
          updatePlanTask={this.updatePlanTask}
          sectionId={this.state.sectionId ? this.state.sectionId : 0}
          menuId = {this.props.menuInfo.id}
          menuCode={this.props.menuInfo.menuCode}
          groupCode={this.state.groupCode}
          editAuth={this.state.editAuth}
          delvEditAuth={this.state.editAuth}
          fileEditAuth={this.state.editAuth}
          cprtmEditAuth={this.state.cprtmEditAuth}
          taskEditAuth={taskEditAuth}
          addItem={this.addItem}
          deleteItem={this.deleteItem}
          baseLineTime={this.state.baseLineTime}
          getTaskByID={this.getTaskByID}
          openWorkFlowMenu={this.props.openWorkFlowMenu}
          logEdit={true} //影藏进展日志删除按钮
          customLabel = {{tableName : "wsd_plan_task",edit : this.state.editAuth}}
          extInfo={{
            startContent
          }}
          projSet={this.state.projSet}
          isShow={false}
          isCheckWf={true}
        />
        {this.state.columState && <Colum columHandle={this.columHandle} handleCancel={this.handlePublicCancel} />}
        {/* 删除提示 */}
        {this.state.visible && <TipModal onOk={this.handleOk} onCancel={this.removeRow} />}
      </ExtLayout>
    )
  }
}

export default connect(state => ({
  currentLocale: state.localeProviderData
}))(PlanPrepared);
