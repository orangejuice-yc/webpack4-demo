import React, { Component } from 'react';
import { Icon, Row, Col, Popover } from 'antd';
import { Input, Form, Button, Select, DatePicker } from 'antd';
import style from './style.less';
import moment from 'moment';
import { formItemLayout, getBaseData } from '@/modules/Suzhou/components/Util/util';
class Search extends Component {
  state = {
    visible: false,
    subcontrType: [],
    status: [],
  };
  //保存视图
  handleSubmit = () => {
    this.props.form.validateFieldsAndScroll((err, values) => {
      if (!err) {
        if (values.time && Array.isArray(values.time)) {
          values.time = values.time.map(item => moment(item).format('YYYY'));
          values.startTime = values.time[0];
          values.endTime = values.time[1];
        } else {
          values.startTime = '';
          values.endTime = '';
        }
        for (let key in values) {
          if (!values[key]) {
            values[key] = '';
          }
        }
        delete values.time;
        this.props.handleSearch(values);
      }
    });
  };
  render() {
    const { getFieldDecorator } = this.props.form;
    const content = (
      <Form onSubmit={this.handleSubmit} style={{ width: 380 }} className={style.formstyle}>
        <div className={style.content}>
          <Row>
            <Form.Item label="状态：" {...formItemLayout}>
              {getFieldDecorator('status')(
                <Select size="small" placeholder="请选择">
                  {this.state.status.map(item => (
                    <Select.Option value={item.value} key={item.value}>
                      {item.title}
                    </Select.Option>
                  ))}
                </Select>
              )}
            </Form.Item>
          </Row>
          <Row>
            <Form.Item label="分包类型：" {...formItemLayout}>
              {getFieldDecorator('subcontrType')(
                <Select size="small" placeholder="请选择">
                  {this.state.subcontrType.map(item => (
                    <Select.Option value={item.value} key={item.value}>
                      {item.title}
                    </Select.Option>
                  ))}
                </Select>
              )}
            </Form.Item>
          </Row>
          <Row>
            <Form.Item label="发起时间：" {...formItemLayout}>
              {getFieldDecorator('time')(
                <DatePicker.RangePicker
                  placeholder={['开始年份', '结束年份']}
                  mode={['year', 'year']}
                  format="YYYY"
                  size="small"
                  onChange={value => this.props.form.setFieldsValue({ time: value })}
                  onPanelChange={value => this.props.form.setFieldsValue({ time: value })}
                />
              )}
            </Form.Item>
          </Row>
          <Row>
            <Form.Item label="编号/名称：" {...formItemLayout}>
              {getFieldDecorator('searcher')(<Input size="small" placeholder="请输入" />)}
            </Form.Item>
          </Row>
          {/* 操作 */}
          <Row>
            <Col span={24}>
              <Col span={12} offset={12}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Button style={{ width: 88 }} onClick={() => this.props.form.resetFields()}>
                    重置
                  </Button>
                  <Button type="primary" onClick={this.handleSubmit}>
                    搜索
                  </Button>
                </div>
              </Col>
            </Col>
          </Row>
        </div>
      </Form>
    );
    return (
      <div className={style.main}>
        <Popover
          placement="bottomRight"
          content={content}
          trigger="click"
          visible={this.state.visible}
          onVisibleChange={visible => {
            this.setState(() => ({ visible }));
            if (visible) {
              if (this.state.status.length === 0) {
                getBaseData('szxm.aqgl.subcontrtype').then(data =>
                  this.setState({ subcontrType: data })
                );
              }
              if (this.state.subcontrType.length === 0) {
                getBaseData('base.flow.status').then(data => this.setState({ status: data }));
              }
            }
          }}
        >
          <span className={style.search}>搜索</span>
          <Icon
            type={this.state.visible ? 'align-right' : 'unordered-list'}
            style={{ fontSize: 16, marginLeft: 5, verticalAlign: 'sub' }}
          />
        </Popover>
      </div>
    );
  }
}

export default Form.create()(Search);
