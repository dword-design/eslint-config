import eslint from '../eslint'
import expect from 'expect'

export default () => expect(eslint('export default () => console.log(\'foo\')')).toBeTruthy()
