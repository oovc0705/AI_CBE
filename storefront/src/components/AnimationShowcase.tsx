'use client';

import ScrollReveal from '@/app/(store)/ScrollReveal';

/**
 * AnimationShowcase — Demo component showing all available animation presets
 * Use this as reference for implementing animations in your project
 */
export default function AnimationShowcase() {
  const animations = [
    { direction: 'up' as const, label: 'Slide Up', description: '从下方滑入' },
    { direction: 'down' as const, label: 'Slide Down', description: '从上方滑入' },
    { direction: 'left' as const, label: 'Slide Left', description: '从左侧滑入' },
    { direction: 'right' as const, label: 'Slide Right', description: '从右侧滑入' },
    { direction: 'fade' as const, label: 'Fade In', description: '淡入效果' },
    { direction: 'scale' as const, label: 'Scale In', description: '缩放进入' },
    { direction: 'bounce' as const, label: 'Bounce In', description: '弹跳进入' },
    { direction: 'flip' as const, label: 'Flip In', description: '3D翻转进入' },
    { direction: 'rotate' as const, label: 'Rotate In', description: '旋转进入' },
    { direction: 'zoom-left' as const, label: 'Zoom Left', description: '从左缩放' },
    { direction: 'zoom-right' as const, label: 'Zoom Right', description: '从右缩放' },
  ];

  const easingTypes = [
    { value: 'smooth' as const, label: 'Smooth', description: '平滑缓动' },
    { value: 'bounce' as const, label: 'Bounce', description: '弹跳缓动' },
    { value: 'elastic' as const, label: 'Elastic', description: '弹性缓动' },
  ];

  return (
    <div className="max-w-6xl mx-auto px-4 py-16">
      <h2 className="text-h1 font-extrabold text-gray-900 mb-4">动画预设展示</h2>
      <p className="text-body-lg text-gray-500 mb-12">
        向下滚动查看所有动画效果，向上滚动查看退出动画
      </p>

      {/* Animation Examples */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-16">
        {animations.map((anim) => (
          <ScrollReveal
            key={anim.direction}
            direction={anim.direction}
            delay={0}
            duration={700}
            easing="smooth"
          >
            <div className="card-content p-6 hover-lift">
              <div className="mb-4 h-32 bg-gradient-to-br from-brand/20 to-brand/5 rounded-lg flex items-center justify-center">
                <span className="text-4xl">🎨</span>
              </div>
              <h3 className="font-bold text-gray-900 mb-2">{anim.label}</h3>
              <p className="text-caption text-gray-500">{anim.description}</p>
              <code className="text-caption text-brand mt-2 block">
                direction="{anim.direction}"
              </code>
            </div>
          </ScrollReveal>
        ))}
      </div>

      {/* Easing Examples */}
      <h3 className="text-h2 font-extrabold text-gray-900 mb-8">缓动曲线示例</h3>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
        {easingTypes.map((easing) => (
          <ScrollReveal
            key={easing.value}
            direction="up"
            delay={0}
            duration={800}
            easing={easing.value}
          >
            <div className="card-content p-6 hover-lift">
              <div className="mb-4 h-40 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-lg flex items-center justify-center">
                <div className="w-16 h-16 bg-brand rounded-full animate-pulse" />
              </div>
              <h4 className="font-bold text-gray-900 mb-2">{easing.label}</h4>
              <p className="text-caption text-gray-500">{easing.description}</p>
              <code className="text-caption text-brand mt-2 block">
                easing="{easing.value}"
              </code>
            </div>
          </ScrollReveal>
        ))}
      </div>

      {/* Usage Examples */}
      <h3 className="text-h2 font-extrabold text-gray-900 mb-8">使用示例</h3>
      <div className="space-y-8">
        {/* Example 1: Staggered animation */}
        <ScrollReveal direction="up" duration={800}>
          <div className="card-content p-8">
            <h4 className="font-bold text-gray-900 mb-4">交错动画（Staggered）</h4>
            <p className="text-body-base text-gray-600 mb-6">
              通过为子元素设置不同的 delay，创建依次出现的效果
            </p>
            <div className="flex gap-4">
              {[1, 2, 3, 4].map((i) => (
                <ScrollReveal key={i} direction="scale" delay={i * 100} duration={500}>
                  <div className="w-16 h-16 bg-brand rounded-lg flex items-center justify-center text-white font-bold">
                    {i}
                  </div>
                </ScrollReveal>
              ))}
            </div>
            <pre className="mt-6 p-4 bg-gray-100 rounded-lg text-caption overflow-x-auto">
{`{/* 交错动画示例 */}
{[1, 2, 3, 4].map((i) => (
  <ScrollReveal key={i} direction="scale" delay={i * 100}>
    <div>Item {i}</div>
  </ScrollReveal>
))}`}
            </pre>
          </div>
        </ScrollReveal>

        {/* Example 2: Once animation */}
        <ScrollReveal direction="left" duration={800}>
          <div className="card-content p-8">
            <h4 className="font-bold text-gray-900 mb-4">单次动画（Once Mode）</h4>
            <p className="text-body-base text-gray-600 mb-6">
              设置 once={true}，动画只播放一次，不会在离开视口时退出
            </p>
            <ScrollReveal direction="bounce" once={true} duration={1000}>
              <div className="p-6 bg-brand/10 rounded-lg text-center">
                <span className="text-2xl">🎯</span>
                <p className="font-semibold text-brand mt-2">我只会出现一次！</p>
              </div>
            </ScrollReveal>
            <pre className="mt-6 p-4 bg-gray-100 rounded-lg text-caption overflow-x-auto">
{`{/* 单次动画示例 */}
<ScrollReveal direction="bounce" once={true}>
  <div>我只会出现一次！</div>
</ScrollReveal>`}
            </pre>
          </div>
        </ScrollReveal>

        {/* Example 3: Different durations */}
        <ScrollReveal direction="right" duration={800}>
          <div className="card-content p-8">
            <h4 className="font-bold text-gray-900 mb-4">不同持续时间（Duration）</h4>
            <p className="text-body-base text-gray-600 mb-6">
              通过调整 duration 控制动画快慢（单位：毫秒）
            </p>
            <div className="space-y-4">
              {[300, 700, 1200].map((duration) => (
                <ScrollReveal key={duration} direction="fade" duration={duration}>
                  <div className="p-4 bg-gray-50 rounded-lg flex items-center justify-between">
                    <span className="font-medium">{duration}ms</span>
                    <div className="h-2 bg-brand rounded-full" style={{ width: `${duration / 10}px` }} />
                  </div>
                </ScrollReveal>
              ))}
            </div>
            <pre className="mt-6 p-4 bg-gray-100 rounded-lg text-caption overflow-x-auto">
{`{/* 不同持续时间示例 */}
<ScrollReveal direction="fade" duration={300}>
  <div>快速 (300ms)</div>
</ScrollReveal>
<ScrollReveal direction="fade" duration={700}>
  <div>正常 (700ms)</div>
</ScrollReveal>
<ScrollReveal direction="fade" duration={1200}>
  <div>慢速 (1200ms)</div>
</ScrollReveal>`}
            </pre>
          </div>
        </ScrollReveal>
      </div>

      {/* CSS Classes Reference */}
      <h3 className="text-h2 font-extrabold text-gray-900 mb-8 mt-16">CSS 工具类</h3>
      <ScrollReveal direction="up" duration={800}>
        <div className="card-content p-8">
          <p className="text-body-base text-gray-600 mb-6">
            除了使用 ScrollReveal 组件，你还可以直接使用 CSS 类实现简单动画
          </p>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {['fade-in', 'slide-up', 'slide-down', 'slide-left', 'slide-right', 
              'scale-in', 'bounce-in', 'flip-in', 'rotate-in', 'zoom-left', 
              'zoom-right', 'pulse', 'shake'].map((className) => (
              <div key={className} className="p-3 bg-gray-50 rounded text-center">
                <code className="text-caption text-brand">{className}</code>
              </div>
            ))}
          </div>
          <pre className="mt-6 p-4 bg-gray-100 rounded-lg text-caption overflow-x-auto">
{`<!-- CSS 类使用示例 -->
<div className="fade-in">淡入效果</div>
<div className="bounce-in delay-200">延迟200ms弹跳</div>
<div className="hover-lift">悬停时上浮</div>
<div className="hover-scale">悬停时缩放</div>`}
          </pre>
        </div>
      </ScrollReveal>
    </div>
  );
}
