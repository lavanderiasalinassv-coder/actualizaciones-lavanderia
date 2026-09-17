import { mount } from '@vue/test-utils'
import homePage from '@/views/homePage.vue'
import { describe, expect, test } from 'vitest'

describe('homePage.vue', () => {
  test('renders tab 1 homePage', () => {
    const wrapper = mount(homePage)
    expect(wrapper.text()).toMatch('Tab 1 page')
  })
})
