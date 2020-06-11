import React from 'react';
import {Form,DatePicker} from 'antd';

class FormDate extends React.Component {

  constructor(props) {
    super(props)
    this.state = {
      ...this.initProps(this.props)
    }
  }

  initProps = () =>{
    return {

    }
  }

  componentWillReceiveProps(newProps, state) {
    this.setState({...this.initProps(newProps)});
  }

  componentDidMount() {

  }
  filterProps =(props) =>{
    let ret = new Object();
    if(props){
      let keys = Object.keys(props);
      for(let i = 0,len = keys.length; i < len; i++){
        let key = keys[i];
        if(key != "value" && key != "formType" && key != "dictType" && key != "displayValue" && key !="formItemLayout" && key != "getFieldDecorator"){
          ret[key] = props[key];
        }
      }
    }
    return ret;
  }
  render() {
    let {value,getFieldDecorator,formItemLayout} = this.props || {};
    let props = this.filterProps(this.props);
    return (
      <span>
        <Form.Item label={props.label } {...formItemLayout}>
          {getFieldDecorator(props.name, {
            initialValue: value || null,
            rules: [{
              required: props.required || false,
              message: props.message
            }],
          })(
            <DatePicker style={{ width: '100%' }} {...props}/>
          )}
        </Form.Item>

      </span>
    );
  }
}

export default FormDate;
