import React, { Component } from 'react';
import style from './style.less';
import { Table, Form } from 'antd';
// import Search from '../../../../../components/Search'
import { connect } from 'react-redux';
import '../../../../../../../asserts/antd-custom.less';
import axios from '../../../../../../../api/axios';
import * as WorkFolw from '../../../../../../Components/Workflow/Start';
import * as dataUtil from '../../../../../../../utils/dataUtil';
import MyIcon from '../../../../../../../components/public/TopTags/MyIcon';
// import { getReleaseMeetingList } from '../../../../../../../api/api';
import { queryFlowStopReworkList } from '@/modules/Suzhou/api/suzhou-api';

import Search from '../../../../../components/Search';
class PlanPreparedRelease extends Component {
  constructor(props) {
    super(props);
    this.state = {
      initDone: false,
      step: 1,
      columns: [],
      data: [],
      info: {},
      selectedRowKeys: [],
      currentData: [],
      activeIndex: [],
    };
  }

  initDatas = () => {
    const { projectId, sectionId, title ,parentData} = this.props;
    // const params = {
    //   ...this.props.searchParam,
    //   projectId,
    //   sectionIds: sectionId,
    //   status: 'INIT',
    // };
    // axios.get(queryFlowStopReworkList(0), { params }).then(res => {
    //   this.setState({
    //     data: res.data.data,
    //     initData: res.data.data,
    //   });
    // });
    this.setState({
      data:[parentData],
      initData:[parentData]
    })
    this.getInfo(parentData);
    if(parentData){
      const newArr = [];
      newArr.push({"bizId" : parentData.id, "bizType":this.props.bizType});
      this.props.getSubmitData(newArr);
    }
  };
  getInfo = record => {
    this.setState({
      activeIndex: record.id,
    });
  };
  setClassName = record => {
    //判断索引相等时添加行的高亮样式
    return record.id === this.state.activeIndex ? 'tableActivty' : '';
  };

  componentDidMount() {
    // 初始化数据
    this.initDatas();
  }
  // 查询
  search = text => {
    const { initData } = this.state;
    let newData = dataUtil.search(initData, [{ key: 'applyNum', value: text }], true);
    this.setState({
      data: newData,
    });
  };
  getSubmitData = () => {};
  render() {
    const { intl } = this.props.currentLocale;

    const columns = [
      // {
      //   title: '申请编号',
      //   dataIndex: 'applyNum',
      //   key: 'applyNum',
      // },
      {
        title: '项目名称',
        dataIndex: 'projectDictVo',
        key: 'projectDictVo',
        render:(text,record)=>{
          return (!text || !text.name)?'':text.name
        }
      },
      {
        title: '标段名称',
        dataIndex: 'sectionName',
        key: 'sectionName',
      },
      {
        title: '单位名称',
        dataIndex: 'company',
        key: 'company',
      },
      // {
      //   title: '合同号',
      //   dataIndex: 'contract',
      //   key: 'contract',
      // },
     
      // {
      //   title: '监理单位',
      //   dataIndex: 'jldw',
      //   key: 'jldw',
      // },
      {
        title: '类别',
        dataIndex: 'typeVo.name',
        key: 'typeVo.name',
      },
      {
        title: '申请复工日期 ',
        dataIndex: 'stopReworkDate',
        key: 'stopReworkDate',
      },
      {
        title: '状态',
        dataIndex: 'statusVo.name',
        key: 'statusVo.name',
      },
      {
        title: '创建人',
        dataIndex: 'creater',
        key: 'creater',
      },
      {
        title: '创建日期',
        dataIndex: 'creatTime',
        key: 'creatTime',
      },
    ];
    let { selectedRowKeys } = this.state;
    const rowSelection = {
      selectedRowKeys,
      onChange: (selectedRowKeys, selectedRow) => {
        this.setState({
          selectedRowKeys,
        });
        let selectedItems = new Array();
        if (selectedRow) {
          for (let i = 0, len = selectedRow.length; i < len; i++) {
            let item = selectedRow[i];
            selectedItems.push({ bizId: item.id, bizType: this.props.bizType,origData:item });
          }
        }
        this.props.getSubmitData(selectedItems);
      },
      getCheckboxProps: record => ({
        //disabled: record.type != "delv"
      }),
    };

    let display = this.props.visible ? '' : 'none';
    return (
      <div style={{ display: display }}>
        <div className={style.tableMain}>
          <div className={style.search} style={{ marginTop: '10px', marginBottom: '10px' }}>
            {/* <Search search={this.search} placeholder={'申请编号'} /> */}
          </div>
          <Table
            rowKey={record => record.id}
            defaultExpandAllRows={true}
            pagination={false}
            name={this.props.name}
            columns={columns}
            // rowSelection={rowSelection}
            rowClassName={this.setClassName}
            dataSource={this.state.data}
            size="small"
            onRow={(record, index) => {
              return {
                onClick: () => {
                  this.getInfo(record, index);
                },
                onDoubleClick: event => {
                  event.currentTarget.getElementsByClassName('ant-checkbox-wrapper')[0].click();
                },
              };
            }}
          />
        </div>
      </div>
    );
  }
}

const PlanPreparedReleases = Form.create()(PlanPreparedRelease);

const mapStateToProps = state => {
  return {
    currentLocale: state.localeProviderData,
  };
};

const DelvApporal = connect(
  mapStateToProps,
  null
)(PlanPreparedReleases);
export default WorkFolw.StartWorkFlow(DelvApporal);
/**
 * 对象转url参数
 * @param {*} data
 * @param {*} isPrefix
 */
const queryParams = obj => {
  if (typeof obj === 'object') {
    let params = [];
    for (let key in obj) {
      params.push({
        [key]: obj[key],
      });
    }
    params = params.map(item => {
      let str = '';
      for (let key in item) {
        str = key + '=' + item[key];
      }
      return str;
    });
    return params.join('&');
  }
  throw Error('发生错误');
};
