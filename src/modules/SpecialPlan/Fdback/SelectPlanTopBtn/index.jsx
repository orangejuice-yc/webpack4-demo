/*
 * @Author: wihoo.wanghao 
 * @Date: 2019-01-17 11:35:16 
 * @Last Modified by: wihoo.wanghao
 * @Last Modified time: 2019-03-30 18:42:06
 */

import React from 'react'
import { Icon, Popover, Button, Table,notification } from 'antd';

import style from './style.less'
import Search from "../../../../components/public/Search"
import { throws } from 'assert';
import axios from "../../../../api/axios"
import {getuserauthtree} from "../../../../api/api"
import MyIcon from "../../../../components/public/TopTags/MyIcon"
class SelectProjectBtn extends React.Component {
    constructor(props) {
        super(props)
        this.state = {
           
            visible: false,
            activeIndex: [],
            rightData:[],
            data: []
        }
    }

    search=value=>{
            const {data}=this.state
            
            let arr=[]
            function find(array){
              
                array.forEach(item=>{
                  
                    if(item.name.indexOf(value)>-1){
                        arr.push(item)
                    }else{
                        if(item.children){
                            find(item.children)
                        }
                    }
                })
            }
           find(data)
           this.setState({
               data1:arr
           })
    }

    handleClose = () => {
        this.setState({
            visible: false,
        });
    }

    handleOpen = () => {
        const { rightData } = this.state
        if(rightData.length > 0) {
            this.setState({
                visible: false,
                activeIndex:[],
                rightData:[]
            });
            let idArray=rightData.map(item=>item.id)
            this.props.openPlan(idArray)
        } else {
            notification.warning(
                {
                    placement: 'bottomRight',
                    bottom: 50,
                    duration: 1,
                    message: '警告',
                    description: '没有选择计划！'
                }
            )
            return
        }
        return
        this.setState({
            visible: false,
        });
    }

    handleVisibleChange = (visible) => {
        this.setState({ visible });
       
        if(visible){
            axios.get(getuserauthtree).then(res=>{
                this.setState({
                    data:res.data.data,
                    data1:res.data.data
                })
            })
        }
    }

    getInfo = (record, event) => {
        let i = this.state.activeIndex.findIndex((value) => value === record.id+record.type)
        if(record.type=="eps"){
            return
        }
        //选择项目
        if(record.type=="project"){
            return
        }
        if (event.ctrlKey || event.shiftKey) {
            if (i != -1) {
                this.setState((preState, props) => {
                    preState.activeIndex.splice(i, 1)
                    preState.rightData.splice(i, 1)
                    return {
                        activeIndex: preState.activeIndex,
                        rightData:preState.rightData
                    }
                })
            } else {
                this.setState((prevState, props) => ({
                    activeIndex: [...prevState.activeIndex, record.id+record.type],
                    rightData:[...prevState.rightData, record]
                }));
            }

        } else {
            if (i != -1) {
                this.setState({
                    activeIndex: [],
                    rightData:[]
                })
            } else {
                this.setState({
                    activeIndex: [record.id+record.type],
                    rightData:[record]
                })
            }

        }

    }

    setClassName = (record, index) => {
        //判断索引相等时添加行的高亮样式
        if (this.state.activeIndex.findIndex(value => record.id+record.type === value) > -1) {
            return 'tableActivty'
        } else {
            return "";
        }

    }
    render() {
        const { data1 } = this.state
        const columns = [
            {
                title: "名称",
                dataIndex: 'name',
                key: 'name',
                render: (text,record)=>{
                    if(record.type=="eps"){
                        return <span><MyIcon type="icon-xiangmuqun" style={{ fontSize: '18px' }} /> {text}</span>
                    }
                    if(record.type=="project"){
                        return <span><MyIcon type="icon-xiangmu" style={{ fontSize: '18px' }} /> {text}</span>
                    }
                    if(record.type=="define"){
                        return <span><MyIcon type="icon-jihua1" style={{ fontSize: '18px' }} /> {text}</span>
                    }
                }
            }
        ]
        const content = (
            <div className={style.main} style={{padding: "20px 10px 20px 20px"}}>
                <Search search={this.search}></Search>
                <div className={style.project} >
                    <Table columns={columns} dataSource={data1} pagination={false}
                        rowClassName={this.setClassName}
                        rowKey={record => record.id+record.type}
                        scroll={{ y: 240 }}
                        size="small"
                        onRow={(record, index) => {
                            return {
                                onClick: (event) => {
                                    this.getInfo(record, event)

                                }

                            }
                        }
                        } />
                </div>
                <div className={style.footer}>
                    <span>按住ctr或shift可同时选择多个项目</span>
                    <div className={style.btn}>
                        <Button onClick={this.handleClose.bind(this)}>关闭项目</Button>
                        <Button type="primary" onClick={this.handleOpen.bind(this)}>打开项目</Button>
                    </div>
                </div>
            </div>
        );
        return (
            <div className={style.main}>
                <Popover
                    placement="bottomLeft"
                    content={content} trigger="click"
                    visible={this.state.visible}
                    onVisibleChange={this.handleVisibleChange}
                >
                    <div className={style.titleass}>
                        <Icon type="table" style={{ paddingRight: "5px" }} />
                        <span>选择计划</span>
                        <Icon type="caret-down" />
                    </div>
                </Popover>
            </div>
        )
    }
}

export default SelectProjectBtn